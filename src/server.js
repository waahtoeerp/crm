const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const pg = require("pg");
const materials = require("./materials");
const qr = require("./qr");

const ROOT = path.join(__dirname, "..");
const DATE_OID = 1082;
pg.types.setTypeParser(DATE_OID, (value) => value);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function readConfig(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "config", `${name}.json`), "utf8"));
}

const STATUSES = ["prospect", "start", "ongoing", "end"];
const PROJECT_FIELDS = {
  status: { column: "status", kind: "status" },
  prospectDate: { column: "prospect_date", kind: "date" },
  startDate: { column: "start_date", kind: "date" },
  endDate: { column: "end_date", kind: "date" },
  quoteSent: { column: "quote_sent_date", kind: "date" },
  quoteAccepted: { column: "quote_accepted_date", kind: "date" },
  invoiceSent: { column: "invoice_sent_date", kind: "date" },
  invoicePaid: { column: "invoice_paid_date", kind: "date" },
  invoiceNumber: { column: "invoice_number", kind: "text" },
  folderUrl: { column: "folder_url", kind: "url" },
};

class ValidationError extends Error {}

function cleanValue(field, kind, raw) {
  const value = raw === null || raw === undefined ? "" : String(raw).trim();
  if (kind === "status") {
    if (!STATUSES.includes(value)) throw new ValidationError(`${field}: invalid status`);
    return value;
  }
  if (value === "") return null;
  if (kind === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      throw new ValidationError(`${field}: expected YYYY-MM-DD`);
    }
    return value;
  }
  if (kind === "url") {
    if (!/^https?:\/\//.test(value)) throw new ValidationError(`${field}: expected http(s) link`);
    return value;
  }
  if (value.length > 200) throw new ValidationError(`${field}: too long`);
  return value;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));

app.get("/api/config", (req, res) => {
  res.json({
    theme: readConfig("theme"),
    texts: readConfig("texts"),
    pages: readConfig("pages"),
    methods: readConfig("methods"),
  });
});

app.get("/api/customers", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.customer_id, c.name, c.email, c.phone,
           COUNT(p.project_id)::int AS "projectCount"
    FROM customers c
    LEFT JOIN projects p ON p.customer_id = c.customer_id
    GROUP BY c.customer_id
    ORDER BY c.name
  `);
  res.json(rows);
});

app.get("/api/projects", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.project_id AS "projectId", c.name AS "customerName", p.status,
           p.prospect_date AS "prospectDate", p.start_date AS "startDate",
           p.end_date AS "endDate", p.quote_sent_date AS "quoteSent",
           p.quote_accepted_date AS "quoteAccepted", p.invoice_sent_date AS "invoiceSent",
           p.invoice_paid_date AS "invoicePaid", p.invoice_number AS "invoiceNumber",
           p.folder_url AS "folderUrl"
    FROM projects p
    JOIN customers c ON c.customer_id = p.customer_id
    ORDER BY c.name, p.project_id
  `);
  res.json(rows);
});

app.put("/api/projects/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid project id" });

  const body = req.body ?? {};
  const assignments = [];
  const values = [];
  try {
    for (const [field, spec] of Object.entries(PROJECT_FIELDS)) {
      if (!(field in body)) continue;
      values.push(cleanValue(field, spec.kind, body[field]));
      assignments.push(`${spec.column} = $${values.length}`);
    }
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
  if (assignments.length === 0) return res.status(400).json({ error: "nothing to update" });

  values.push(id);
  const { rowCount } = await pool.query(
    `UPDATE projects SET ${assignments.join(", ")} WHERE project_id = $${values.length}`,
    values,
  );
  if (rowCount === 0) return res.status(404).json({ error: "project not found" });
  res.json({ ok: true });
});

const DASHBOARD_LIST_WHERE = {
  acceptedNotStarted: `p.quote_accepted_date IS NOT NULL AND p.start_date IS NULL AND p.status <> 'end'`,
  quotesOpen: `p.quote_sent_date IS NOT NULL AND p.quote_accepted_date IS NULL AND p.status <> 'end'`,
  invoicesOpen: `p.invoice_sent_date IS NOT NULL AND p.invoice_paid_date IS NULL`,
};

app.get("/api/dashboard", async (req, res) => {
  const counts = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status <> 'end')::int AS active,
      COUNT(*) FILTER (WHERE status = 'end')::int AS ended,
      COUNT(*) FILTER (WHERE quote_sent_date IS NOT NULL AND quote_accepted_date IS NULL AND status <> 'end')::int AS "quotesOpen",
      COUNT(*) FILTER (WHERE quote_accepted_date IS NOT NULL AND start_date IS NULL AND status <> 'end')::int AS "acceptedNotStarted",
      COUNT(*) FILTER (WHERE invoice_sent_date IS NOT NULL AND invoice_paid_date IS NULL)::int AS "invoicesOpen"
    FROM projects
  `);
  const stages = await pool.query(`SELECT status, COUNT(*)::int AS count FROM projects GROUP BY status`);

  const lists = {};
  for (const [key, where] of Object.entries(DASHBOARD_LIST_WHERE)) {
    const { rows } = await pool.query(`
      SELECT p.project_id AS "projectId", c.name AS "customerName",
             p.status, p.quote_sent_date AS "quoteSent", p.quote_accepted_date AS "quoteAccepted",
             p.invoice_sent_date AS "invoiceSent", p.start_date AS "startDate"
      FROM projects p
      JOIN customers c ON c.customer_id = p.customer_id
      WHERE ${where}
      ORDER BY c.name, p.project_id
    `);
    lists[key] = rows;
  }

  res.json({
    counts: counts.rows[0],
    stages: Object.fromEntries(stages.rows.map((row) => [row.status, row.count])),
    lists,
  });
});

app.get("/api/materials", async (req, res) => {
  res.json(await materials.listMaterials(pool));
});

app.post("/api/materials", async (req, res) => {
  let input;
  try {
    input = materials.parseMaterial(req.body ?? {});
  } catch (err) {
    if (err instanceof materials.ValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
  res.status(201).json(await materials.createMaterial(pool, input));
});

const { runAnalysis } = require("./analysis");

app.get("/api/insights", async (req, res) => {
  res.json(await runAnalysis("insights"));
});

app.post("/api/forecast", async (req, res) => {
  const { method, materialId, pieces } = req.body ?? {};
  const validPieces =
    Array.isArray(pieces) &&
    pieces.length >= 1 &&
    pieces.length <= 20 &&
    pieces.every(
      (p) =>
        Number.isFinite(p?.width) && Number.isFinite(p?.height) &&
        p.width > 0 && p.height > 0 && p.width <= 5000 && p.height <= 5000,
    );
  const validMethod = typeof method === "string" && Object.hasOwn(readConfig("methods"), method);
  if (!validMethod || !Number.isInteger(materialId) || !validPieces) {
    return res.status(400).json({ error: "invalid forecast input" });
  }
  const result = await runAnalysis("forecast", { method, materialId, pieces });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.get("/qr/:kind/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Object.hasOwn(qr.KINDS, req.params.kind) || !Number.isInteger(id)) return res.status(404).end();
  const png = await qr.qrPng(pool, req.params.kind, id);
  if (!png) return res.status(404).end();
  res.type("png").send(png);
});

app.get("/api/project-sheet/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "project not found" });

  const { rows } = await pool.query(
    `SELECT p.project_id AS "projectId", c.name AS "customerName", p.status
     FROM projects p
     JOIN customers c ON c.customer_id = p.customer_id
     WHERE p.project_id = $1`,
    [id],
  );
  if (rows.length === 0) return res.status(404).json({ error: "project not found" });

  const files = await pool.query(
    `SELECT file_id AS "fileId", description FROM files WHERE project_id = $1 ORDER BY file_id`,
    [id],
  );
  const machines = await pool.query(
    `SELECT machine_id AS "machineId", name, type FROM machines ORDER BY machine_id`,
  );

  const picked = await pool.query(
    `SELECT DISTINCT ON (item_kind) item_kind, item_id
     FROM selections
     WHERE project_id = $1
     ORDER BY item_kind, selected_at DESC, selection_id DESC`,
    [id],
  );
  const chosen = new Set(picked.rows.map((row) => `${row.item_kind}:${row.item_id}`));

  const project = rows[0];
  res.json({
    project: {
      ...project,
      code: `PRJ-${String(project.projectId).padStart(4, "0")}`,
      qrPath: `/qr/project/${project.projectId}`,
    },
    files: files.rows,
    machines: machines.rows.map((m) => ({
      ...m,
      code: `MCH-${String(m.machineId).padStart(4, "0")}`,
      qrPath: `/qr/machine/${m.machineId}`,
      selected: chosen.has(`machine:${m.machineId}`),
    })),
    materials: (await materials.listMaterials(pool)).map((m) => ({
      ...m,
      selected: chosen.has(`material:${m.materialId}`),
    })),
  });
});

app.post("/api/project-sheet/:id/selections", async (req, res) => {
  const projectId = Number(req.params.id);
  const { kind, itemId } = req.body ?? {};
  const valid =
    Number.isInteger(projectId) &&
    (kind === "machine" || kind === "material") &&
    Number.isInteger(itemId);
  if (!valid) return res.status(400).json({ error: "invalid selection" });

  const spec = qr.KINDS[kind];
  const item = await pool.query(`SELECT 1 FROM ${spec.table} WHERE ${spec.idColumn} = $1`, [itemId]);
  if (item.rowCount === 0) return res.status(404).json({ error: "item not found" });

  await pool.query(
    `INSERT INTO selections (project_id, item_kind, item_id) VALUES ($1, $2, $3)`,
    [projectId, kind, itemId],
  );
  res.status(201).json({ ok: true });
});

const pages = readConfig("pages");
for (const page of Object.values(pages)) {
  app.get(page.path, (req, res) => {
    res.sendFile(path.join(ROOT, "public", page.file));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`CRM running at http://localhost:${port}`);
});
