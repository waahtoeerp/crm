"""The one place where production-time and price calculations live.

The web server calls this through analysis/cli.py. Exploration lives in analysis/explore.py.
"""

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent


def read_config(name: str) -> dict:
    return json.loads((ROOT / "config" / f"{name}.json").read_text())


def driver(method: str, width_mm: float, height_mm: float) -> float:
    """Size that drives run time: area in m² for uvPrint, outline length in m for cut and route."""
    if method == "uvPrint":
        return width_mm * height_mm / 1_000_000
    return 2 * (width_mm + height_mm) / 1000


def load_runs(conn) -> pd.DataFrame:
    rows = conn.execute(
        """
        SELECT o.file_id, o.method, m.material_id, m.name AS material,
               o.started_at, o.ended_at,
               f.width_mm::float8 AS width_mm, f.height_mm::float8 AS height_mm
        FROM operations o
        JOIN materials m ON m.material_id = o.material_id
        LEFT JOIN files f ON f.file_id = o.file_id
        """
    ).fetchall()
    runs = pd.DataFrame(
        rows,
        columns=["file_id", "method", "material_id", "material", "started_at", "ended_at", "width_mm", "height_mm"],
    )
    started = pd.to_datetime(runs["started_at"], utc=True)
    ended = pd.to_datetime(runs["ended_at"], utc=True)
    runs["minutes"] = (ended - started).dt.total_seconds() / 60
    return runs


def load_material_names(conn) -> dict[int, str]:
    return dict(conn.execute("SELECT material_id, name FROM materials").fetchall())


def insights(runs: pd.DataFrame) -> list[dict]:
    finished = runs.dropna(subset=["minutes"])
    grouped = (
        finished.groupby(["material", "method"])
        .agg(runs=("minutes", "size"), avgMinutes=("minutes", "mean"), lastRun=("started_at", "max"))
        .reset_index()
        .sort_values(["material", "method"])
    )
    return [
        {
            "material": row.material,
            "method": row.method,
            "runs": int(row.runs),
            "avgMinutes": round(float(row.avgMinutes), 1),
            "lastRun": pd.Timestamp(row.lastRun).date().isoformat(),
        }
        for row in grouped.itertuples()
    ]


def price(area_m2: float, method: str, material: str, prices: dict) -> dict:
    material_rate = prices["materials"].get(material)
    method_rate = prices["methods"].get(method)
    result = {
        "materialPriceM2": material_rate,
        "methodPriceM2": method_rate,
        "materialCost": None if material_rate is None else round(area_m2 * material_rate, 2),
        "methodCost": None if method_rate is None else round(area_m2 * method_rate, 2),
    }
    if result["materialCost"] is None or result["methodCost"] is None:
        result["total"] = None
    else:
        result["total"] = round(result["materialCost"] + result["methodCost"], 2)
    return result


def forecast(runs: pd.DataFrame, method: str, material: str, pieces: list[dict], prices: dict) -> dict:
    total_driver = sum(driver(method, p["width"], p["height"]) for p in pieces)
    area_m2 = round(sum(p["width"] * p["height"] for p in pieces) / 1_000_000, 2)

    sized = runs[
        (runs["method"] == method)
        & (runs["material"] == material)
        & runs["minutes"].notna()
        & runs["width_mm"].notna()
        & runs["height_mm"].notna()
    ]
    run_drivers = [driver(method, w, h) for w, h in zip(sized["width_mm"], sized["height_mm"])]
    estimates = [
        minutes / run_driver * total_driver
        for minutes, run_driver in zip(sized["minutes"], run_drivers)
        if run_driver > 0
    ]

    result = {"runs": len(estimates), "totalAreaM2": area_m2, **price(area_m2, method, material, prices)}
    if not estimates:
        result.update(estimateMinutes=None, lowMinutes=None, highMinutes=None)
    else:
        result.update(
            estimateMinutes=round(sum(estimates) / len(estimates), 1),
            lowMinutes=round(min(estimates), 1),
            highMinutes=round(max(estimates), 1),
        )
    return result
