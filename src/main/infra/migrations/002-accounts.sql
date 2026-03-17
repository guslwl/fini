-- src/main/infra/migrations/002-accounts.sql

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    category TEXT NOT NULL, -- 'asset' | 'liability' | 'income' | 'expense' | 'equity'
    type TEXT NOT NULL,     -- 'checking' | 'savings' | 'brokerage' | 'asset' |
                            -- 'credit_card' | 'income' | 'expense' | 'equity' | 'group'
    currency TEXT NOT NULL DEFAULT 'BRL',
    notes TEXT,
    parent_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
    archived_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
