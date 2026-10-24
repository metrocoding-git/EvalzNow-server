/**
 * Benchmark ID lists are stored in JSON columns. Depending on the database
 * (MySQL / MariaDB) and on how the row was written they come back as an array,
 * as JSON text, or as double-encoded JSON text. Always returns an array.
 */
function toIdArray(value) {
  let v = value;
  for (let i = 0; i < 2 && typeof v === "string"; i++) {
    try { v = JSON.parse(v || "[]"); } catch { return []; }
  }
  return Array.isArray(v) ? v : [];
}

module.exports = { toIdArray };
