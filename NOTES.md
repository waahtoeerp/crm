# Kysymyksiä asiakkaalle

1. mitä tiedostomuotoja?
2. missä datat elävät?
3. mitä koneita käytetään?
4. mitkä materiaalit otetaan testiin?

# if simulation fails
The baseline is saved in two forms, so you can return to this stage either way.

Neon branch baseline-2026-10-12: an exact copy of production as it is now, including the QR tokens and all rows.
db/seed.sql: rebuilds the same data from an empty database. I tested this in a scratch schema, and the row counts match: 5 customers, 22 projects, 1 file, 3 machines, 5 materials, 5 operations, 10 selections. The test was rolled back, so nothing changed.
To regenerate the seed after changes, run uv run --env-file .env.local tools/db_snapshot.py.

Things to know:

The 10 selection rows include my test clicks and your browser clicks. Tell me if you'd like them removed before the simulation.
The branch isn't protected, so it could be deleted by mistake. I can protect it in Neon if you want.
Retreating means either running reset_from_parent on production to return it to the branch, or rebuilding from schema.sql and seed.sql.