# /// script
# requires-python = ">=3.11"
# dependencies = ["psycopg[binary]>=3.2"]
# ///
"""Write the current database contents to db/seed.sql as INSERT statements.

Run from the project root with: uv run --env-file .env.local tools/db_snapshot.py
Rebuild from scratch: run db/schema.sql on an empty database, then db/seed.sql.
"""

import os
from pathlib import Path

import psycopg
from psycopg import sql

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "db" / "seed.sql"

# Parents before children, so foreign keys are satisfied when the file is replayed.
TABLES = ["customers", "projects", "files", "machines", "materials", "operations", "selections"]

SERIAL_KEYS = {
    "customers": "customer_id",
    "projects": "project_id",
    "machines": "machine_id",
    "materials": "material_id",
    "operations": "operation_id",
    "selections": "selection_id",
}


def table_inserts(conn: psycopg.Connection, table: str) -> list[str]:
    cursor = conn.execute(sql.SQL("SELECT * FROM {}").format(sql.Identifier(table)))
    columns = [desc.name for desc in cursor.description]
    statements = []
    for row in cursor.fetchall():
        values = ", ".join(sql.Literal(value).as_string(conn) for value in row)
        names = ", ".join(f'"{name}"' for name in columns)
        statements.append(f"INSERT INTO {table} ({names}) VALUES ({values});")
    if table in SERIAL_KEYS and statements:
        key = SERIAL_KEYS[table]
        statements.append(
            f"SELECT setval(pg_get_serial_sequence('{table}', '{key}'), (SELECT MAX({key}) FROM {table}));"
        )
    return statements


def main() -> None:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL is not set. Run with --env-file .env.local")

    lines = [
        "-- Mock baseline data. Run db/schema.sql on an empty database first.",
        "BEGIN;",
    ]
    counts = {}
    with psycopg.connect(url) as conn:
        for table in TABLES:
            statements = table_inserts(conn, table)
            counts[table] = len(statements) - (1 if table in SERIAL_KEYS and statements else 0)
            lines.append(f"\n-- {table}")
            lines.extend(statements)
    lines.append("\nCOMMIT;")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n")
    summary = ", ".join(f"{table} {count}" for table, count in counts.items())
    print(f"Wrote {OUT.relative_to(ROOT)}: {summary}")


if __name__ == "__main__":
    main()
