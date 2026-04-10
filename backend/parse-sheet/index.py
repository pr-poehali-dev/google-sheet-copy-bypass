"""
Парсинг данных из Google Таблиц.
Поддерживает публичные таблицы через CSV-экспорт Google Sheets.
Сохраняет результат в БД и возвращает данные.
"""
import json
import os
import re
import urllib.request
import urllib.error
import urllib.parse
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p40413581_google_sheet_copy_by")


def get_db():
    dsn = os.environ['DATABASE_URL']
    if '?' not in dsn:
        dsn += '?sslmode=disable'
    return psycopg2.connect(dsn)


def extract_sheet_id(url: str):
    for pattern in [r'/spreadsheets/d/([a-zA-Z0-9_-]+)', r'key=([a-zA-Z0-9_-]+)']:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


def extract_gid(url: str) -> str:
    m = re.search(r'gid=(\d+)', url)
    return m.group(1) if m else '0'


def fetch_via_gviz(sheet_id: str, gid: str = '0', sheet_range: str = '') -> str:
    base = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&gid={gid}"
    if sheet_range:
        base += f"&range={urllib.parse.quote(sheet_range)}"
    req = urllib.request.Request(base, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8')


def fetch_csv_export(sheet_id: str, gid: str = '0') -> str:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8')


def parse_csv(raw: str, use_headers: bool = True, remove_empty: bool = False) -> dict:
    import csv, io
    rows = list(csv.reader(io.StringIO(raw)))
    if not rows:
        return {"headers": [], "rows": [], "rows_count": 0, "columns_count": 0}
    if remove_empty:
        rows = [r for r in rows if any(cell.strip() for cell in r)]
    if use_headers and rows:
        headers, data_rows = rows[0], rows[1:]
    else:
        headers = [f"Столбец {i+1}" for i in range(len(rows[0]))] if rows else []
        data_rows = rows
    return {"headers": headers, "rows": data_rows, "rows_count": len(data_rows), "columns_count": len(headers)}


def handler(event: dict, context) -> dict:
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # GET — история
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, url, rows_count, columns_count, status, error_message, created_at FROM {SCHEMA}.parse_history ORDER BY created_at DESC LIMIT 50")
        db_rows = cur.fetchall()
        cur.close()
        conn.close()
        result = []
        for row in db_rows:
            result.append({
                'id': row[0], 'name': row[1], 'url': row[2],
                'rows_count': row[3], 'columns_count': row[4],
                'status': row[5], 'error_message': row[6],
                'created_at': row[7].strftime('%d.%m.%Y %H:%M') if row[7] else '',
            })
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'history': result}, ensure_ascii=False),
        }

    # POST — парсинг
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        url = body.get('url', '').strip()
        sheet_range = body.get('range', '').strip()
        use_headers = body.get('use_headers', True)
        remove_empty = body.get('remove_empty', False)
        bypass_mode = body.get('bypass_mode', 'auto')
        name = body.get('name', '').strip() or 'Без названия'

        if not url:
            return {
                'statusCode': 400,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'URL таблицы обязателен'}, ensure_ascii=False),
            }

        sheet_id = extract_sheet_id(url)
        if not sheet_id:
            return {
                'statusCode': 400,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Не удалось определить ID таблицы. Проверьте ссылку.'}, ensure_ascii=False),
            }

        gid = extract_gid(url)

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.parse_history (name, url, range, bypass_mode, use_headers, remove_empty, status) VALUES (%s, %s, %s, %s, %s, %s, 'processing') RETURNING id",
            (name, url, sheet_range, bypass_mode, use_headers, remove_empty)
        )
        record_id = cur.fetchone()[0]
        conn.commit()

        raw_csv = None
        error_msg = None

        for fetch_fn, args in [(fetch_via_gviz, (sheet_id, gid, sheet_range)), (fetch_csv_export, (sheet_id, gid))]:
            try:
                raw_csv = fetch_fn(*args)
                break
            except urllib.error.HTTPError as e:
                error_msg = f"HTTP {e.code}: таблица недоступна или закрыта"
            except Exception as e:
                error_msg = str(e)

        if not raw_csv:
            cur.execute(
                f"UPDATE {SCHEMA}.parse_history SET status='error', error_message=%s, updated_at=NOW() WHERE id=%s",
                (error_msg or 'Не удалось получить данные', record_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 422,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': error_msg or 'Не удалось получить данные'}, ensure_ascii=False),
            }

        parsed = parse_csv(raw_csv, use_headers=use_headers, remove_empty=remove_empty)

        cur.execute(
            f"UPDATE {SCHEMA}.parse_history SET status='success', rows_count=%s, columns_count=%s, data=%s::jsonb, updated_at=NOW() WHERE id=%s",
            (parsed['rows_count'], parsed['columns_count'], json.dumps(parsed, ensure_ascii=False), record_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({
                'id': record_id,
                'headers': parsed['headers'],
                'rows': parsed['rows'][:5],
                'rows_count': parsed['rows_count'],
                'columns_count': parsed['columns_count'],
            }, ensure_ascii=False),
        }

    return {'statusCode': 405, 'headers': cors, 'body': ''}