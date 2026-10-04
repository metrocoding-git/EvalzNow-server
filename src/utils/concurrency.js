/**
 * Run `fn` over `items` with at most `limit` running at once.
 * Results are returned in the SAME ORDER as `items` (identical to a sequential loop),
 * so any later aggregation produces exactly the same output - just faster.
 */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

const REPORT_CONCURRENCY = Math.max(1, Number(process.env.REPORT_CONCURRENCY || 4));

module.exports = { mapLimit, REPORT_CONCURRENCY };
