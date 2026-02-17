-- main/infra/migrations/001-initial.sql

CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    type TEXT, -- Feriado Nacional, etc
    date DATE,
    is_business_day BOOLEAN,
    should_count_as_business_day BOOLEAN,
    deleted_at TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payables_recurring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    history TEXT NOT NULL,
    due_day INTEGER,
    should_postpone BOOLEAN,
    value INTEGER, -- em centavos
    notes TEXT,
    deleted_at TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    history TEXT NOT NULL,
    invoice_id TEXT,
    account_id TEXT,
    due_date DATE,
    preferred_date DATE,
    value INTEGER,
    parent_id INTEGER,
    paid_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES payables_recurring(id) ON DELETE SET NULL
);
