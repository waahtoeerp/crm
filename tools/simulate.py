# /// script
# requires-python = ">=3.11"
# dependencies = ["psycopg[binary]>=3.2"]
# ///
"""Add simulated production runs to the database, or remove them.

Every simulated row is marked: file IDs start with SIM-, and the customer is SIM_CUSTOMER.
Run from the project root with:
  uv run --env-file .env.local tools/simulate.py           # add simulated runs
  uv run --env-file .env.local tools/simulate.py --reset   # remove them
"""

import argparse
import datetime as dt
import os
import random
import uuid

import psycopg

SIM_CUSTOMER = "SIM (simulaatio)"
SIM_PROJECTS = 3
FILES_PER_PROJECT = 8
SEED = 42

# The hidden "true" behaviour the model should learn. The expert formula starts without these numbers.
SETUP_MIN = {"uvPrint": 8, "cut": 5, "route": 12}
MINUTES_PER_UNIT = {"uvPrint": 60, "cut": 8, "route": 15}  # uvPrint: per m2; cut and route: per m of outline
MATERIAL_FACTOR = {
    "Alumiinikomposiittilevy 3 mm": 1.0,
    "Vaahtomuovilevy PVC 5 mm": 0.8,
    "Akryylilevy 3 mm": 1.4,
    "Polykarbonaattilevy 2 mm": 1.2,
    "Kiiltävä vinyylitarra": 0.9,
}
METHOD_MACHINE = {"uvPrint": "UV-tulostin", "cut": "Digitaalileikkuri", "route": "CNC-jyrsin"}
NOISE_SIGMA = 0.15


def reset(conn: psycopg.Connection) -> None:
    conn.execute(
        "DELETE FROM operations WHERE file_id IN (SELECT file_id FROM files WHERE file_id LIKE 'SIM-%')"
    )
    conn.execute("DELETE FROM files WHERE file_id LIKE 'SIM-%'")
    conn.execute(
        "DELETE FROM selections WHERE project_id IN (SELECT p.project_id FROM projects p "
        "JOIN customers c ON c.customer_id = p.customer_id WHERE c.name = %s)",
        (SIM_CUSTOMER,),
    )
    conn.execute(
        "DELETE FROM projects WHERE customer_id IN (SELECT customer_id FROM customers WHERE name = %s)",
        (SIM_CUSTOMER,),
    )
    conn.execute("DELETE FROM customers WHERE name = %s", (SIM_CUSTOMER,))


def generate(conn: psycopg.Connection) -> dict[str, int]:
    rng = random.Random(SEED)
    exists = conn.execute("SELECT 1 FROM customers WHERE name = %s", (SIM_CUSTOMER,)).fetchone()
    if exists:
        raise SystemExit("Simulation data already exists. Run with --reset first.")

    materials = dict(conn.execute("SELECT name, material_id FROM materials").fetchall())
    machines = dict(conn.execute("SELECT name, machine_id FROM machines").fetchall())
    customer_id = conn.execute(
        "INSERT INTO customers (name) VALUES (%s) RETURNING customer_id", (SIM_CUSTOMER,)
    ).fetchone()[0]

    file_number = 0
    operations = 0
    today = dt.date(2026, 10, 12)
    for _ in range(SIM_PROJECTS):
        project_id = conn.execute(
            "INSERT INTO projects (customer_id, status, start_date, qr_token) "
            "VALUES (%s, 'ongoing', %s, %s) RETURNING project_id",
            (customer_id, today - dt.timedelta(days=rng.randint(10, 60)), uuid.uuid4().hex),
        ).fetchone()[0]

        for _ in range(FILES_PER_PROJECT):
            file_number += 1
            file_id = f"SIM-{file_number:04d}"
            width = round(rng.uniform(200, 1200), 1)
            height = round(rng.uniform(150, 800), 1)
            conn.execute(
                "INSERT INTO files (file_id, project_id, description, width_mm, height_mm) "
                "VALUES (%s, %s, %s, %s, %s)",
                (file_id, project_id, "Simuloitu tiedosto", width, height),
            )

            for _ in range(rng.randint(1, 3)):
                method = rng.choice(list(SETUP_MIN))
                material_name = rng.choice(list(MATERIAL_FACTOR))
                if method == "uvPrint":
                    driver = width * height / 1_000_000
                else:
                    driver = 2 * (width + height) / 1000
                minutes = (
                    SETUP_MIN[method]
                    + MINUTES_PER_UNIT[method] * driver * MATERIAL_FACTOR[material_name]
                ) * rng.lognormvariate(0, NOISE_SIGMA)

                day = today - dt.timedelta(days=rng.randint(0, 60))
                start = dt.datetime.combine(day, dt.time(hour=rng.randint(7, 15)), tzinfo=dt.timezone.utc)
                end = start + dt.timedelta(minutes=minutes)
                conn.execute(
                    "INSERT INTO operations (file_id, material_id, machine_id, method, started_at, ended_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (file_id, materials[material_name], machines[METHOD_MACHINE[method]], method, start, end),
                )
                operations += 1

    return {"projects": SIM_PROJECTS, "files": file_number, "operations": operations}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="remove simulated data instead of adding it")
    args = parser.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL is not set. Run with --env-file .env.local")

    with psycopg.connect(url) as conn:
        if args.reset:
            reset(conn)
            print("Removed simulated data.")
        else:
            summary = generate(conn)
            print(f"Added simulated data: {summary}")


if __name__ == "__main__":
    main()
