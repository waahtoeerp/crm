CREATE TABLE customers (
    customer_id  SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT
);

CREATE TABLE projects (
    project_id    SERIAL PRIMARY KEY,
    customer_id   INTEGER NOT NULL REFERENCES customers (customer_id),
    folder_url    TEXT,
    status        TEXT NOT NULL CHECK (status IN ('prospect', 'start', 'ongoing', 'end')),
    prospect_date DATE,
    start_date    DATE,
    end_date      DATE,
    quote_sent_date      DATE,
    quote_accepted_date  DATE,
    invoice_sent_date    DATE,
    invoice_paid_date    DATE,
    invoice_number       TEXT
);
