const QRCode = require("qrcode");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

const KINDS = {
  material: { table: "materials", idColumn: "material_id", prefix: "m" },
  machine: { table: "machines", idColumn: "machine_id", prefix: "mc" },
  project: { table: "projects", idColumn: "project_id", prefix: "p" },
};

function scanUrl(kind, token) {
  return `${APP_URL}/${KINDS[kind].prefix}/${token}`;
}

async function qrPng(pool, kind, id) {
  const spec = KINDS[kind];
  const { rows } = await pool.query(
    `SELECT qr_token FROM ${spec.table} WHERE ${spec.idColumn} = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  return QRCode.toBuffer(scanUrl(kind, rows[0].qr_token), { width: 240, margin: 2 });
}

module.exports = { KINDS, qrPng };
