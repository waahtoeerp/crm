const crypto = require("node:crypto");

class ValidationError extends Error {}

function materialCode(id) {
  return `MAT-${String(id).padStart(4, "0")}`;
}

function parseMaterial(body) {
  const name = String(body.name ?? "").trim();
  const unit = String(body.unit ?? "").trim();
  if (name === "" || name.length > 200) throw new ValidationError("name: 1-200 characters required");
  if (unit === "" || unit.length > 20) throw new ValidationError("unit: 1-20 characters required");

  let unitCost = null;
  if (body.unitCost !== null && body.unitCost !== undefined && String(body.unitCost).trim() !== "") {
    unitCost = Number(body.unitCost);
    if (!Number.isFinite(unitCost) || unitCost < 0 || unitCost > 99999999.99) {
      throw new ValidationError("unitCost: a number from 0 to 99999999.99 required");
    }
  }
  return { name, unit, unitCost };
}

async function createMaterial(pool, input) {
  const token = crypto.randomBytes(16).toString("hex");
  const { rows } = await pool.query(
    `INSERT INTO materials (name, unit, unit_cost, qr_token)
     VALUES ($1, $2, $3, $4)
     RETURNING material_id`,
    [input.name, input.unit, input.unitCost, token],
  );
  const id = rows[0].material_id;
  return { materialId: id, code: materialCode(id), qrPath: `/qr/material/${id}` };
}

async function listMaterials(pool) {
  const { rows } = await pool.query(
    `SELECT material_id AS "materialId", name, unit, unit_cost AS "unitCost"
     FROM materials
     ORDER BY material_id`,
  );
  return rows.map((row) => ({
    materialId: row.materialId,
    code: materialCode(row.materialId),
    name: row.name,
    unit: row.unit,
    unitCost: row.unitCost === null ? null : Number(row.unitCost),
    qrPath: `/qr/material/${row.materialId}`,
  }));
}

module.exports = { ValidationError, parseMaterial, createMaterial, listMaterials };
