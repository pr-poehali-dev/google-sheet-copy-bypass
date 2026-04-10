CREATE TABLE IF NOT EXISTS t_p40413581_google_sheet_copy_by.parse_history (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    sheet_name TEXT DEFAULT 'Лист 1',
    range TEXT DEFAULT '',
    rows_count INTEGER DEFAULT 0,
    columns_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing',
    error_message TEXT,
    bypass_mode TEXT DEFAULT 'auto',
    use_headers BOOLEAN DEFAULT TRUE,
    remove_empty BOOLEAN DEFAULT FALSE,
    encoding TEXT DEFAULT 'utf-8',
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
