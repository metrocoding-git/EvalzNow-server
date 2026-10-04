/**
 * Load / speed test.
 *   node tests/performance/load-test.js <baseUrl> <user> <password> <label> [clientId unitId candidateId]
 * Requires: npm i -D autocannon
 * Writes load-<label>.json with requests/sec, latency (p50/p97.5/p99) and bytes transferred.
 */
const autocannon = require('autocannon');
const fs = require('fs');
const [,, BASE, USER, PASS, LABEL = 'run', CLIENT = '2', UNIT = '1', CAND = '1'] = process.argv;

const TARGETS = [
  // [name, path, connections, seconds]
  ['Login (password check)', null, 5, 8],
  ['Candidate list', `/candidates/${CLIENT}`, 20, 10],
  ['Unit roster', `/unit_roster/unit/${UNIT}`, 20, 10],
  ['Scoring trends', `/scoring-trends?unitId=${UNIT}&candidate_id=${CAND}`, 20, 10],
  ['Proficiency table', `/tabulation/proficiency?unitId=${UNIT}&candidate_id=${CAND},${Number(CAND) + 1},${Number(CAND) + 2}`, 20, 10],
  ['Insert scores for a unit (large)', `/insert-score/unit/${UNIT}`, 5, 15],
  ['Unit data report (heavy)', `/data-report/unit-level/${UNIT}`, 5, 25],
  ['Candidate-level data report (heavy)', `/data-report/candidate-level/${UNIT}`, 5, 25],
];

async function token() {
  const r = await fetch(`${BASE}/account`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: USER, password: PASS }) });
  return (await r.json()).token;
}

(async () => {
  const tok = await token();
  const rows = [];
  for (const [name, path, connections, duration] of TARGETS) {
    const opts = path
      ? { url: BASE + path, connections, duration, headers: { authorization: `Bearer ${tok}`, 'accept-encoding': 'gzip' } }
      : { url: `${BASE}/account`, method: 'POST', connections, duration, headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username: USER, password: PASS }) };
    const r = await autocannon({ ...opts, timeout: 120 });
    const row = {
      name, path: path || 'POST /account', connections,
      reqPerSec: +r.requests.average.toFixed(1),
      p50ms: r.latency.p50, p97_5ms: r.latency.p97_5, p99ms: r.latency.p99,
      kbPerResponse: Math.round(r.throughput.total / Math.max(1, r.requests.total) / 1024),
      totalRequests: r.requests.total, errors: r.errors + r.timeouts, non2xx: r.non2xx,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  fs.writeFileSync(`load-${LABEL}.json`, JSON.stringify({ label: LABEL, base: BASE, at: new Date().toISOString(), rows }, null, 1));
})();
