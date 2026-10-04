/**
 * "Calculations unchanged" check.
 * Calls the same analytics/report endpoints on the OLD server and the NEW server
 * (both pointing at the same database) and confirms the JSON results are identical.
 *
 *   node tests/performance/compare-outputs.js <oldBaseUrl> <newBaseUrl> <user> <password> [clientId unitId candidateIds]
 *   e.g. node tests/performance/compare-outputs.js http://localhost:4100/api/v1 http://localhost:4000/api/v1 super@test.com Test@12345 2 1 1,2,3
 */
const crypto = require('crypto');

const [,, OLD, NEW, USER, PASS, CLIENT = '2', UNIT = '1', CANDS = '1,2,3'] = process.argv;
const C1 = CANDS.split(',')[0];

const ENDPOINTS = [
  `/candidates/${CLIENT}`, `/units/${CLIENT}`, `/staffs/${CLIENT}`, `/units/id/${UNIT}`,
  `/unit_roster/unit/${UNIT}`, `/unit_roster/unit/${UNIT}/candidate/${C1}`, `/unit_roster/candidate/${C1}`,
  `/assessment_block_manager/unit/${UNIT}`, `/assessment_block_manager/unit/${UNIT}/candidate/${C1}`,
  `/insert-score/unit/${UNIT}`, `/insert-score/unit/${UNIT}/candidate/${C1}`, `/insert-score/insert/unit/${UNIT}/${C1}`,
  `/insert-score/summary?unitId=${UNIT}&candidate_id=${C1}`, `/insert-score/critical-range/1/${UNIT}/${C1}`,
  `/scoring-criteria/unit/${UNIT}`,
  `/scoring-trends?unitId=${UNIT}&candidate_id=${C1}`, `/scoring-trends/se?unitId=${UNIT}&candidate_id=${C1}`,
  `/scoring-trends/attained-score?unitId=${UNIT}&candidate_id=${C1}`, `/scoring-trends/max-score?unitId=${UNIT}&candidate_id=${C1}`,
  `/tabulation/ratio?unitId=${UNIT}&candidate_id=${C1}`, `/tabulation/proficiency?unitId=${UNIT}&candidate_id=${CANDS}`,
  `/auxiliary/unit/${UNIT}/candidate/${C1}`, `/auxiliary/marks/${UNIT}/${C1}`, `/auxiliary/assessment/${UNIT}/${C1}`,
  `/auxiliary/assessment/summary/${UNIT}/${CANDS}`, `/auxiliary/lesson/${UNIT}`, `/auxiliary/leader/${UNIT}`,
  `/auxiliary/effort/${UNIT}/${C1}`, `/auxiliary/chain/${UNIT}/${C1}`,
  `/neuro-science/${UNIT}/${C1}`, `/neuro-science/rms/${UNIT}/${C1}`,
  `/projection/unit/${UNIT}/candidate/${C1}`,
  `/global-analytics/${CLIENT}`, `/global-analytics/thres/${CLIENT}`, `/global-analytics/stable/${CLIENT}`,
  `/global-analytics/ic/${CLIENT}`, `/global-analytics/ur/${CLIENT}`,
  `/data-extract/${UNIT}`, `/data-extract/all/${CLIENT}`, `/data-extract/all/${CLIENT}/${C1}`,
  `/data-report/${UNIT}/${C1}`, `/data-report/unit-level/${UNIT}`, `/data-report/candidate-level/${UNIT}`,
  `/data-report/client-level/${CLIENT}`, `/data-report/global/${CLIENT}`,
];

const POSTS = ['normal-dist', 't-dist', 'exponential-dist', 'chi-dist', 'f-dist', 'beta-dist', 'uniform-dist',
  'weibull-cdf-dist', 'weibull-pdf-dist', 'weibull-risk-dist'].map((d) => [
  `/unit-distribution/${d}`,
  { unitId: Number(UNIT), candidatePpList: CANDS.split(',').map((c) => ({ candidateId: Number(c), ppId: 1 })) },
]);

async function token(base) {
  const r = await fetch(`${base}/account`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: USER, password: PASS }) });
  return (await r.json()).token;
}

// Sort object keys so key order differences never count as a change
const canon = (v) => (Array.isArray(v) ? v.map(canon)
  : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = canon(v[k]); return o; }, {}) : v);
const hash = (v) => crypto.createHash('sha256').update(JSON.stringify(canon(v))).digest('hex').slice(0, 16);

async function get(base, tok, path, body) {
  const t = Date.now();
  const r = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json', 'accept-encoding': 'gzip' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, json, ms: Date.now() - t, bytes: text.length };
}

(async () => {
  const [tOld, tNew] = await Promise.all([token(OLD), token(NEW)]);
  const rows = [];
  let same = 0;
  for (const [path, body] of [...ENDPOINTS.map((p) => [p]), ...POSTS]) {
    const a = await get(OLD, tOld, path, body);
    const b = await get(NEW, tNew, path, body);
    const identical = a.status === b.status && hash(a.json) === hash(b.json);
    if (identical) same++;
    rows.push({ endpoint: (body ? 'POST ' : 'GET ') + path, status: b.status, identical, oldMs: a.ms, newMs: b.ms, kb: Math.round(b.bytes / 1024) });
    console.log(`${identical ? 'IDENTICAL' : 'DIFFERENT'}  ${String(a.ms).padStart(6)}ms -> ${String(b.ms).padStart(6)}ms  ${rows.at(-1).endpoint}`);
  }
  console.log(`\n${same}/${rows.length} endpoints return identical results`);
  require('fs').writeFileSync(process.env.OUT || 'compare-outputs.json', JSON.stringify({ same, total: rows.length, rows }, null, 1));
  process.exit(same === rows.length ? 0 : 1);
})();
