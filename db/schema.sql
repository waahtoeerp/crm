CREATE TABLE customers (
    customer_id  SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT
);

CREATE TABLE projects (
    project_id    SERIAL PRIMARY KEY,
    customer_id   INTEGER NOT NULL REFERENCES customers (customer_id),
    qr_token      TEXT UNIQUE,
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

CREATE TABLE materials (
    material_id  SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    qr_token     TEXT NOT NULL UNIQUE
);

CREATE TABLE files (
    file_id      TEXT PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects (project_id),
    description  TEXT,
    width_mm     NUMERIC(10, 1),
    height_mm    NUMERIC(10, 1),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE machines (
    machine_id   SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    type         TEXT NOT NULL,
    qr_token     TEXT UNIQUE
);

-- Append-only history. The current machine or material of a project is its latest row per item_kind.
CREATE TABLE selections (
    selection_id SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects (project_id),
    item_kind    TEXT NOT NULL CHECK (item_kind IN ('machine', 'material')),
    item_id      INTEGER NOT NULL,
    selected_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE operations (
    operation_id SERIAL PRIMARY KEY,
    file_id      TEXT NOT NULL REFERENCES files (file_id),
    material_id  INTEGER NOT NULL REFERENCES materials (material_id),
    machine_id   INTEGER REFERENCES machines (machine_id),
    method       TEXT NOT NULL,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at     TIMESTAMPTZ
);
