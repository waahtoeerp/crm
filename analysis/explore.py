# %% [markdown]
# # Production model: exploration
# Run each `# %%` cell in VS Code (Interactive Window) or Jupyter.
# Load the database once, then explore. The calculations themselves live in model.py.

# %%
import os
import sys
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path.cwd() / "analysis"))
import model

conn = psycopg.connect(os.environ["DATABASE_URL"])
runs = model.load_runs(conn)
runs.head()

# %% [markdown]
# ## Finished runs per material and method

# %%
finished = runs.dropna(subset=["minutes"])
finished.groupby(["material", "method"]).size().unstack(fill_value=0)

# %% [markdown]
# ## Average minutes per run

# %%
finished.groupby(["material", "method"])["minutes"].mean().round(1).unstack()

# %% [markdown]
# ## Minutes per unit of size, to see the rates the model will work from
# Runs without sizes (the mock runs) are left out.

# %%
sized = finished.dropna(subset=["width_mm", "height_mm"]).copy()
sized["driver"] = [
    model.driver(method, w, h) for method, w, h in zip(sized["method"], sized["width_mm"], sized["height_mm"])
]
sized["minutes_per_unit"] = sized["minutes"] / sized["driver"]
sized.groupby(["method", "material"])["minutes_per_unit"].agg(["size", "mean", "std"]).round(2)

# %% [markdown]
# ## Example forecast: three walls on one material

# %%
prices = model.read_config("prices")
pieces = [{"width": 2400, "height": 3000}, {"width": 2400, "height": 3000}, {"width": 1200, "height": 3000}]
model.forecast(runs, "uvPrint", "Alumiinikomposiittilevy 3 mm", pieces, prices)

# %% [markdown]
# ## Close the connection

# %%
conn.close()
