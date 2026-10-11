# CRM Test Project — Claude Guide

Small test project: a CRM mockup for trying MCP and a Claude-assisted workflow.
The project must stay runnable and understandable without AI.

## Database

- Neon project: `waahto` (`divine-meadow-36360048`), linked to branch `production`.
- Source of truth for the schema: `db/schema.sql`. Change the schema there first, then apply it.
- Credentials live in `.env.local` (gitignored). Never print, copy, or commit them.

### Tables
- `customers`: customer_id, name, email, phone
- `projects`: project_id, customer_id (FK to customers), folder_url (link to the project's materials folder, e.g. OneDrive), status (prospect | start | ongoing | end), prospect_date, start_date, end_date, quote_sent_date, quote_accepted_date, invoice_sent_date, invoice_paid_date, invoice_number

One customer has many projects.

Design files are not stored in this database. `folder_url` only links to them in the company's file storage (OneDrive or SharePoint).

## Rules for Claude

- Work directly on the `production` branch for now. A dev branch will be added before the first MVP.
- Do not create UI files yet.
- Before claiming a table, column, or endpoint exists, check `db/schema.sql` or query the database.
- Keep this file short. Add facts here only when they are stable.

## Layout

- `db/` — schema SQL
- `neon.ts` — Neon infrastructure config
- `package.json` — Node dependencies
- `README.md` — setup steps for a fresh clone
