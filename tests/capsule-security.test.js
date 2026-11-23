/**
 * Capsule (Capacity Accounting) endpoint security sweep.
 * Every route in src/routes/capsule.routes.js is called:
 *   - without a token                      -> 401
 *   - by Organisation A (admin and staff)  with Organisation B's ids in the path and body -> refused, B's data unchanged
 *   - by Organisation A on its OWN capsule but with B's candidate / block ids in the body -> refused
 *   - by Organisation A on its own records -> allowed (the sweep is not just refusing everything)
 * Needs TEST_ALLOW_DB_RESET=1 and a dedicated test database (all tables are recreated).
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

if (process.env.TEST_ALLOW_DB_RESET === '1') {
  const app = require('../src/app');
  const db = require('../src/models');
  const { seed, PASSWORD } = require('./helpers/seed');
  const { ensureDb } = require('../src/config/ensureDb');
  const capsuleRouter = require('../src/routes/capsule.routes');
  const API = '/api/v1/capsules';
  const T = {};
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const login = async (u) => (await request(app).post('/api/v1/account').send({ username: u, password: PASSWORD })).body.token;
  const call = (who, method, path, body) => {
    let r = request(app)[method](API + path);
    if (who) r = r.set(auth(T[who]));
    return body ? r.send(body) : r;
  };

  const ROUTES = [];
  for (const layer of capsuleRouter.stack) {
    if (!layer.route) continue;
    for (const m of Object.keys(layer.route.methods)) ROUTES.push({ method: m, path: layer.route.path });
  }

  const capsuleBody = (code) => ({
    capsuleName: 'Sweep', capsuleId: code, capsuleStartDate: '2026-01-05', capsuleEndDate: '2026-06-30',
    capsuleType: 'Capacity - Combined', signatureProfile: 'Case 1: Solid Balanced', environment: 'Clinical-Neuro',
    frameworkAge: '1-2 years', XEP: 0.7, XCFL: 0.7, MSIP: 0.45, IC: 2, NDIV: 0.5,
  });

  // Build one capsule with a record of every kind for an organisation.
  async function buildOrg(who, clientId, candidateId, code) {
    const ok = (r, what) => { assert.ok(r.status < 300, `${what}: ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
    const cap = ok(await call(who, 'post', '/', capsuleBody(code)), 'capsule');
    const roster = ok(await call(who, 'post', '/roster', { capsuleId: cap.id, candidateId }), 'roster');
    const b1 = ok(await call(who, 'post', '/blocks', { capsuleId: cap.id, candidate_id: candidateId, manageType: 'Direct', periodType: 'Week' }), 'block1');
    const b2 = ok(await call(who, 'post', '/blocks', { capsuleId: cap.id, candidate_id: candidateId, manageType: 'Direct', periodType: 'Week' }), 'block2');
    const score = ok(await call(who, 'post', '/scores', { capsuleId: cap.id, candidate_id: candidateId, blockId: b1.id, capacity: 'Cognitive', criticalRefDate: '2026-01-10', durationDays: 7, attainedScore: 3, maxScore: 5 }), 'score');
    const proj = ok(await call(who, 'post', '/projection', { capsuleId: cap.id, candidateId, ppId: 1 }), 'projection');
    const eff = ok(await call(who, 'post', '/effectivity', { capsuleId: cap.id, candidateId, ppId: 1 }), 'effectivity');
    const aux = ok(await call(who, 'post', '/aux/needAssessments', { capsuleId: cap.id, candidateId, ppId: 1, observation: 'x' }), 'aux');
    return { clientId, candidateId, cap, roster, b1, b2, score, proj, eff, aux };
  }

  // Path params -> the organisation's ids. ":rowId" depends on the route family.
  function fill(path, o) {
    const fam = path.split('/')[1];
    const rowIds = { roster: o.roster.id, blocks: o.b1.id, scores: o.score.id, projection: o.proj.id, effectivity: o.eff.id, aux: o.aux.id };
    return path
      .replace(':clientId', o.clientId)
      .replace(':candidateId', o.candidateId)
      .replace(':kind', 'needAssessments')
      .replace(':index', '1')
      .replace(':rowId', rowIds[fam] ?? o.cap.id)
      .replace(':id', o.cap.id);
  }
  // A body that points at the organisation's records.
  const bodyFor = (o) => ({
    capsuleId: o.cap.id, candidateId: o.candidateId, candidate_id: o.candidateId, blockId: o.b1.id,
    otherId: o.b2.id, ppId: 1, capsuleName: 'HACKED', observation: 'HACKED', name: 'HACKED', capsuleOutcome: 'Pass',
    capacity: 'Cognitive', criticalRefDate: '2026-01-11', durationDays: 7, attainedScore: 1, maxScore: 5, manageType: 'Direct',
  });

  async function snapshot(clientId) {
    const capsules = await db.Capsule.findAll({ where: { clientId }, raw: true });
    const ids = capsules.map((c) => c.id);
    const out = { capsules };
    for (const [name, model] of Object.entries(db)) {
      if (!model || !model.rawAttributes || !/^Capsule./.test(name) || name === 'Capsule') continue;
      if (!model.rawAttributes.capsuleId) continue;
      out[name] = await model.findAll({ where: { capsuleId: ids }, raw: true, order: [['id', 'ASC']] });
    }
    return JSON.stringify(out);
  }

  let A; let B; let beforeB;
  const results = [];

  describe('Capsule endpoint security sweep', () => {
    before(async () => {
      const S = await seed({ candidatesPerClient: 2, scoresPerCandidate: 1 });
      await ensureDb();
      T.adminA = await login('admina@test.com');
      T.adminB = await login('adminb@test.com');
      T.staffA = await login('staffa@test.com');
      A = await buildOrg('adminA', S.clientA.id, S.candidates.A[0].id, 'SW-A');
      B = await buildOrg('adminB', S.clientB.id, S.candidates.B[0].id, 'SW-B');
      beforeB = await snapshot(S.clientB.id);
    });
    after(async () => {
      if (process.env.SWEEP_OUT) require('fs').writeFileSync(process.env.SWEEP_OUT, JSON.stringify(results, null, 1));
      await db.sequelize.close();
    });

    it(`SEC-CAP-01 all ${'capsule'} endpoints refuse requests without a token (401)`, async () => {
      assert.ok(ROUTES.length >= 30, `only ${ROUTES.length} routes found`);
      for (const r of ROUTES) {
        const res = await call(null, r.method, fill(r.path, B), ['post', 'put'].includes(r.method) ? bodyFor(B) : undefined);
        results.push({ test: 'SEC-CAP-01', route: `${r.method.toUpperCase()} ${r.path}`, status: res.status });
        assert.equal(res.status, 401, `${r.method} ${r.path} -> ${res.status}`);
      }
    });

    for (const who of ['adminA', 'staffA']) {
      it(`SEC-CAP-02 ${who === 'adminA' ? 'admin' : 'staff'} of Organisation A is refused on every capsule endpoint with Organisation B ids`, async () => {
        for (const r of ROUTES) {
          const res = await call(who, r.method, fill(r.path, B), ['post', 'put'].includes(r.method) ? bodyFor(B) : undefined);
          results.push({ test: 'SEC-CAP-02', who, route: `${r.method.toUpperCase()} ${r.path}`, status: res.status });
          assert.ok([400, 403, 404].includes(res.status), `${who} ${r.method} ${r.path} -> ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
        }
        assert.equal(await snapshot(B.clientId), beforeB, 'Organisation B capsule data changed');
      });
    }

    it('SEC-CAP-03 Organisation A cannot pull Organisation B candidates or blocks into its own capsule', async () => {
      const mixed = { ...bodyFor(A), candidateId: B.candidateId, candidate_id: B.candidateId, blockId: B.b1.id, otherId: B.b2.id };
      for (const r of ROUTES.filter((x) => x.method === 'post' || x.method === 'put')) {
        const res = await call('adminA', r.method, fill(r.path, A), mixed);
        results.push({ test: 'SEC-CAP-03', route: `${r.method.toUpperCase()} ${r.path}`, status: res.status });
        assert.notEqual(res.status, 500, `${r.method} ${r.path} -> 500`);
      }
      // Whatever was accepted (e.g. a capsule rename ignores candidateId), no row of A may point at B's records.
      const capsA = (await db.Capsule.findAll({ where: { clientId: A.clientId }, raw: true })).map((c) => c.id);
      const bCands = new Set([B.candidateId]);
      const bBlocks = new Set([B.b1.id, B.b2.id]);
      for (const [name, model] of Object.entries(db)) {
        if (!model || !model.rawAttributes || !model.rawAttributes.capsuleId || name === 'Capsule') continue;
        for (const row of await model.findAll({ where: { capsuleId: capsA }, raw: true })) {
          const c = row.candidateId ?? row.candidate_id;
          assert.ok(!bCands.has(c), `${name} ${row.id} of A now points at B candidate`);
          if (row.blockId != null) assert.ok(!bBlocks.has(row.blockId), `${name} ${row.id} of A now points at B block`);
        }
      }
      assert.equal(await snapshot(B.clientId), beforeB, 'Organisation B capsule data changed');
    });

    it('SEC-CAP-04 Organisation A can still read every one of its own capsule GET endpoints', async () => {
      for (const r of ROUTES.filter((x) => x.method === 'get')) {
        const res = await call('adminA', 'get', fill(r.path, A) + (r.path.endsWith('critical-range') ? '?ppId=1' : ''));
        results.push({ test: 'SEC-CAP-04', route: `GET ${r.path}`, status: res.status });
        assert.equal(res.status, 200, `GET ${r.path} -> ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
      }
    });
  });
}
