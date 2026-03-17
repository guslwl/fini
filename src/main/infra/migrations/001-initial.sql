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

CREATE TABLE IF NOT EXISTS scheduled_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount INTEGER,                          -- nullable for variable/unknown amounts
    currency TEXT NOT NULL DEFAULT 'BRL',
    account_id INTEGER,                      -- nullable until accounts exist
    type TEXT NOT NULL,                 -- 'payable', 'receivable'
    frequency TEXT NOT NULL,                 -- 'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual', or day-of-week patterns like 'mon-fri'
    next_date DATE NOT NULL,
    end_type TEXT NOT NULL DEFAULT 'never',  -- 'never', 'after_n', 'until_date'
    end_after_n INTEGER,                     -- used when end_type = 'after_n'
    end_date DATE,                           -- used when end_type = 'until_date'
    occurrences_count INTEGER DEFAULT 0,
    certainty TEXT NOT NULL DEFAULT 'fixed', -- 'fixed', 'estimated', 'unknown'
    provision_strategy TEXT NOT NULL DEFAULT 'none', -- 'none', 'daily', 'monthly', 'sinking'
    should_postpone BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active',   -- 'active', 'paused', 'completed'
    user_triggered BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    deleted_at TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    -- FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL  -- uncomment when accounts table exists
);

CREATE TABLE IF NOT EXISTS payables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    history TEXT NOT NULL,
    invoice_id TEXT,
    account_id TEXT,
    currency TEXT NOT NULL DEFAULT 'BRL',
    due_date DATE,
    preferred_date DATE,
    value INTEGER,
    parent_id INTEGER,
    paid_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES scheduled_transactions(id) ON DELETE SET NULL
);
