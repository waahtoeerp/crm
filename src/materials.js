const crypto = require("node:crypto");

class ValidationError extends Error {}

function materialCode(id) {
  return `MAT-${String(id).padStart(4, "0")}`;
}

function parseMaterial(body) {
  const name = String(body.name ?? "").trim();
  if (name === "" || name.length > 200) throw new ValidationError("name: 1-200 characters required");
  return { name };
}

async function createMaterial(pool, input) {
  const token = crypto.randomBytes(16).toString("hex");
  const { rows } = await pool.query(
    `INSERT INTO materials (name, qr_token)
     VALUES ($1, $2)
     RETURNING material_id`,
    [input.name, token],
  );
  const id = rows[0].material_id;
  return { materialId: id, code: materialCode(id), qrPath: `/qr/material/${id}` };
}

async function listMaterials(pool) {
  const { rows } = await pool.query(
    `SELECT material_id AS "materialId", name
     FROM materials
     ORDER BY material_id`,
  );
  return rows.map((row) => ({
    materialId: row.materialId,
    code: materialCode(row.materialId),
    name: row.name,
    qrPath: `/qr/material/${row.materialId}`,
  }));
}

module.exports = { ValidationError, parseMaterial, createMaterial, listMaterials };
