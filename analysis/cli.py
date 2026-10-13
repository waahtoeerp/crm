# /// script
# requires-python = ">=3.11"
# dependencies = ["psycopg[binary]>=3.2", "pandas>=2.2"]
# ///
"""Entry point the web server calls: reads {"command", "payload"} as JSON on stdin, writes JSON to stdout.

Commands: insights, forecast. Run by hand with:
  echo '{"command": "insights", "payload": {}}' | uv run --env-file .env.local analysis/cli.py
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg  # noqa: E402

import model  # noqa: E402


def main() -> None:
    request = json.load(sys.stdin)
    command = request["command"]
    payload = request.get("payload", {})

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        runs = model.load_runs(conn)
        if command == "insights":
            result = model.insights(runs)
        elif command == "forecast":
            names = model.load_material_names(conn)
            material = names.get(payload["materialId"])
            if material is None:
                result = {"error": "material not found"}
            else:
                result = model.forecast(
                    runs, payload["method"], material, payload["pieces"], model.read_config("prices")
                )
        else:
            result = {"error": f"unknown command: {command}"}

    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
