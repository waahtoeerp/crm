# Model: simulation and calculations

Where the code is:
- `analysis/model.py`: all calculations (run times, insights, forecast, prices).
- `analysis/cli.py`: the bridge the web server calls. Node passes it a request as JSON and reads the answer back.
- `analysis/explore.py`: notebook-style cells (`# %%`) for exploring the data in VS Code or Jupyter.
- `tools/simulate.py`: creates and removes the simulated runs.

## 1. What is simulated

`tools/simulate.py` adds fake production runs to the database so we can test the model before real data exists.

- **Projects:** 3 simulated projects for the customer "SIM (simulaatio)".
- **Design files:** 8 per project, 24 in total. Each file gets a random width of 200–1200 mm and height of 150–800 mm.
- **Runs:** each file gets 1–3 runs. Each run picks a material and a method at random. The machine follows from the method.
- **Dates:** runs start on a random day within the last 60 days, between 07:00 and 15:00 UTC.
- **Marking:** file IDs start with `SIM-`, so `--reset` can remove exactly these rows.

The script uses a fixed random seed (42), so the same data is produced every time.

## 2. How a simulated run time is calculated

The "true" factors are hidden inside the script. The model must learn them from the runs.

| Method | Machine | Setup (min) | Minutes per unit | Size driver |
|---|---|---|---|---|
| uvPrint | UV-tulostin | 8 | 60 | area in m² (width × height) |
| cut | Digitaalileikkuri | 5 | 8 | outline in m (2 × (width + height)) |
| route | CNC-jyrsin | 12 | 15 | outline in m (2 × (width + height)) |

Material factors: aluminium composite 1.0, PVC foam 0.8, acrylic 1.4, polycarbonate 1.2, vinyl 0.9.

```
minutes = (setup + minutes_per_unit × size_driver × material_factor) × noise
```

The noise is a random multiplier with a log-normal spread (σ = 0.15), so runs vary by roughly ±15%.

## 3. How the insights page calculates

`/api/insights` (shown on the Ennusteet page) does not use the simulation's hidden factors. It works only from the recorded runs:

- **Run length:** `ended_at − started_at`, in minutes. Runs without an end time are left out.
- **Average:** the mean run length for each material and method pair.
- **Runs:** the number of finished runs in that pair.
- **Last run:** the date of the most recent start in that pair.

Both mock runs and simulated runs are included, so the averages mix the two until the simulation is removed.

## 4. The planned estimate (not built yet)

The cost model will use the same shape as the simulation, but with factors the expert chooses and the data then corrects:

```
estimate = setup + minutes_per_unit × size_driver × material_factor
```

1. **Starting factors** come from `config/costing.json` (expert values, to be written).
2. **Correction:** for each material and method pair, the model compares actual minutes with the estimate.
3. **Shrinkage for rare pairs:** a pair with few runs is pulled toward its method's average. A pair with many runs relies on its own data. This is an empirical Bayes rule, done in plain SQL.
4. **Comparison:** the Ennusteet page will show estimate versus actual per pair, and how this changes over time.

## 5. Forecast tool (Ennusteet page)

The "Hinta-arvio" form takes a method, a material, and a list of pieces with width and height in mm. It works as follows:

1. Total size: the sum of the pieces' size drivers (area in m² for uvPrint, outline in m for cut and route).
2. For each recorded run of the same method and material that has file sizes, compute its minutes per unit of size: `run minutes ÷ run size driver`.
3. Scale each rate to the total size: `rate × total size driver`.
4. Report the mean as the estimate, and the lowest and highest values as the range.

Prices (from `config/prices.json`, excl. VAT, currently mock values): the total area is multiplied by the material's price per m² and by the method's price per m². The two add up to the total price. A material without a price shows "hinta puuttuu" instead of a total.

Known limit: the setup time is not separated out. Each run's rate includes its setup, so a small-run rate stretched to a large job overstates the large job's time. The first refinement should separate setup from the per-unit rate.

## 6. How to check the model later

The simulation's true factors are known, so the model can be tested directly. If the model recovers the factors in table 2 from the runs, the method works. If it does not, the data or the formula is wrong.
