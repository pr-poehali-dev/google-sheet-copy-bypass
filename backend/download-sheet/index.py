"""
Скачивание данных из БД в нужном формате: xlsx, csv, json, sql.
Принимает id записи из истории и format.
"""
import json
import os
import io
import csv
import re
import base64
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p40413581_google_sheet_copy_by")


def get_db():
    dsn = os.environ['DATABASE_URL']
    if '?' not in dsn:
        dsn += '?sslmode=disable'
    return psycopg2.connect(dsn)


def to_csv(headers: list, rows: list, encoding: str = 'utf-8') -> bytes:
    output = io.StringIO()
    writer = csv.writer(output)
    if headers:
        writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return output.getvalue().encode(encoding, errors='replace')


def to_json(headers: list, rows: list) -> bytes:
    result = []
    for row in rows:
        item = {(headers[i] if i < len(headers) and headers[i] else f"col_{i}"): (row[i] if i < len(row) else "") for i in range(max(len(headers), len(row)))}
        result.append(item)
    return json.dumps(result, ensure_ascii=False, indent=2).encode('utf-8')


def to_sql(headers: list, rows: list, table_name: str = 'sheet_data') -> bytes:
    safe = re.sub(r'[^a-zA-Z0-9_]', '_', table_name.lower())
    col_defs = ', '.join([f'"{h or f"col_{i}"}" TEXT' for i, h in enumerate(headers)])
    cols_str = ', '.join([f'"{h or f"col_{i}"}"' for i, h in enumerate(headers)])
    lines = [f'CREATE TABLE IF NOT EXISTS "{safe}" ({col_defs});', '']
    for row in rows:
        vals = ', '.join(["'" + str(v).replace("'", "''") + "'" for v in row])
        lines.append(f'INSERT INTO "{safe}" ({cols_str}) VALUES ({vals});')
    return '\n'.join(lines).encode('utf-8')


def handler(event: dict, context) -> dict:
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    record_id = params.get('id')
    fmt = params.get('format', 'csv').lower()
    encoding = params.get('encoding', 'utf-8')

    if not record_id:
        return {
            'statusCode': 400,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'id обязателен'}, ensure_ascii=False),
        }

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"SELECT name, data, rows_count FROM {SCHEMA}.parse_history WHERE id=%s AND status='success'",
        (int(record_id),)
    )
    db_row = cur.fetchone()
    cur.close()
    conn.close()

    if not db_row:
        return {
            'statusCode': 404,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Запись не найдена или не обработана'}, ensure_ascii=False),
        }

    name, data_json, rows_count = db_row
    data = json.loads(data_json) if isinstance(data_json, str) else data_json

    headers = data.get('headers', [])
    data_rows = data.get('rows', [])

    if fmt == 'json':
        content = to_json(headers, data_rows)
        mime, ext = 'application/json', 'json'
    elif fmt == 'sql':
        content = to_sql(headers, data_rows, name)
        mime, ext = 'text/plain', 'sql'
    elif fmt == 'xlsx':
        content = to_csv(headers, data_rows, 'utf-8')
        mime, ext = 'text/csv', 'csv'
    else:
        content = to_csv(headers, data_rows, encoding)
        mime, ext = 'text/csv', 'csv'

    safe_name = re.sub(r'[^\w\-]', '_', name)
    encoded = base64.b64encode(content).decode('ascii')

    return {
        'statusCode': 200,
        'headers': {
            **cors,
            'Content-Type': mime,
            'Content-Disposition': f'attachment; filename="{safe_name}.{ext}"',
        },
        'body': encoded,
        'isBase64Encoded': True,
    }