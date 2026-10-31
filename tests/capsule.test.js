/**
 * Capsule (Capacity Accounting) API tests: CRUD, PP ID rules, score validation, cascades and
 * tenant isolation. Needs TEST_ALLOW_DB_RESET=1 and a dedicated test database.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

if (process.env.TEST_ALLOW_DB_RESET === '1') {
  const app = require('../src/app');
  const db = require('../src/models');
  const { seed, PASSWORD } = require('./helpers/seed');
  const { ensureDb } = require('../src/config/ensureDb');
  const API = '/api/v1/capsules';
  let S; const T = {};
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const login = async (u) => (await request(app).post('/api/v1/account').send({ username: u, password: PASSWORD })).body.token;
  const as = (who) => ({
    get: (p) => request(app).get(API + p).set(auth(T[who])),
    post: (p, b) => request(app).post(API + p).set(auth(T[who])).send(b),
    put: (p, b) => request(app).put(API + p).set(auth(T[who])).send(b),
    del: (p) => request(app).delete(API + p).set(auth(T[who])),
  });
  const A = () => as('adminA');
  const B = () => as('adminB');
  let cap; let cand; let cand2; let staffA;

  const newCapsule = (over = {}) => ({
    capsuleName: 'C1_Combined_Neuro', capsuleId: 'CC-001', capsuleStartDate: '2026-01-05', capsuleEndDate: '2026-06-30',
    capsuleType: 'Capacity - Combined', signatureProfile: 'Case 1: Solid Balanced', environment: 'Clinical-Neuro',
    frameworkAge: '1-2 years', XEP: 0.7, XCFL: 0.7, MSIP: 0.45, 'ΔPC1': 0, IC: 2, NDIV: 0.5,
    benchmarks: [{ benchmarkId: '1', benchmarkType: 'Baseline', benchmarkRef: '1', benchmarkDescription: 'Sample' }],
    ...over,
  });

  describe('Capsule API', () => {
    before(async () => {
      S = await seed({ candidatesPerClient: 3, scoresPerCandidate: 2 });
      await ensureDb();
      T.adminA = await login('admina@test.com');
      T.adminB = await login('adminb@test.com');
      T.super = await login('super@test.com');
      cand = S.candidates.A[0].id;
      cand2 = S.candidates.A[1].id;
      staffA = (await db.Staff.findOne({ where: { clientId: S.clientA.id } })).id;
    });
    after(async () => { await db.sequelize.close(); });

    it('CAP-01 create, read, list and update a capsule (thresholds, staff, benchmarks kept)', async () => {
      const r = await A().post('/', newCapsule({ staffLookup: [{ staffId: staffA, roleType: 'Leader' }] }));
      assert.equal(r.status, 201, JSON.stringify(r.body));
      cap = r.body;
      assert.equal(cap.clientId, S.clientA.id);
      assert.equal(cap.XEP, 0.7);
      assert.equal(cap['ΔPC1'], 0);
      assert.equal(cap.staffAssignments.length, 1);
      assert.equal(cap.staffAssignments[0].staff.id, staffA);
      assert.equal(cap.benchmarks[0].benchmarkType, 'Baseline');

      const list = await A().get(`/client/${S.clientA.id}`);
      assert.equal(list.status, 200);
      assert.equal(list.body.length, 1);

      const u = await A().put(`/${cap.id}`, { capsuleName: 'Renamed', XEP: 0.6, staffLookup: [], benchmarks: [] });
      assert.equal(u.status, 200);
      assert.equal(u.body.capsuleName, 'Renamed');
      assert.equal(u.body.XEP, 0.6);
      assert.equal(u.body.XCFL, 0.7);               // untouched thresholds stay
      assert.equal(u.body.staffAssignments.length, 0);
      assert.equal(u.body.benchmarks.length, 0);
      assert.equal((await A().get(`/id/${cap.id}`)).body.capsuleName, 'Renamed');
    });

    it('CAP-02 validation: duplicate Capsule ID, missing Framework Age, unknown type', async () => {
      assert.equal((await A().post('/', newCapsule({ capsuleId: 'cc-001' }))).status, 409);
      assert.equal((await A().post('/', newCapsule({ capsuleId: 'CC-X', frameworkAge: '' }))).status, 400);
      assert.equal((await A().post('/', newCapsule({ capsuleId: 'CC-Y', capsuleType: 'Classroom' }))).status, 400);
      // the same code is allowed for another organisation
      assert.equal((await B().post('/', newCapsule())).status, 201);
    });

    it('CAP-03 another organisation cannot read, change or list the capsule', async () => {
      assert.equal((await B().get(`/id/${cap.id}`)).status, 403);
      assert.equal((await B().put(`/${cap.id}`, { capsuleName: 'x' })).status, 403);
      assert.equal((await B().del(`/${cap.id}`)).status, 403);
      assert.equal((await B().get(`/client/${S.clientA.id}`)).status, 403);
      assert.equal((await B().get(`/store/${S.clientA.id}`)).status, 403);
      assert.equal((await B().get(`/scores/${cap.id}`)).status, 403);
      // staff of another organisation cannot be assigned
      const otherStaff = (await db.Staff.findOne({ where: { clientId: S.clientB.id } })).id;
      assert.equal((await A().put(`/${cap.id}`, { staffLookup: [{ staffId: otherStaff, roleType: 'Leader' }] })).status, 400);
      // super admin can read it
      assert.equal((await as('super').get(`/id/${cap.id}`)).status, 200);
    });

    it('CAP-04 roster: add, duplicate, foreign candidate, connected capsules, outcome update', async () => {
      const r = await A().post('/roster', { capsuleId: cap.id, candidateId: cand, ageRange: '18-25' });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.equal(r.body.capsuleOutcome, 'Ongoing');
      assert.equal(r.body.candidate.id, cand);
      assert.equal((await A().post('/roster', { capsuleId: cap.id, candidateId: cand2 })).status, 201);
      assert.equal((await A().post('/roster', { capsuleId: cap.id, candidateId: cand })).status, 409);
      assert.ok([400, 403].includes((await A().post('/roster', { capsuleId: cap.id, candidateId: S.candidates.B[0].id })).status));
      assert.equal((await B().post('/roster', { capsuleId: cap.id, candidateId: S.candidates.B[0].id })).status, 403);

      const conn = await A().get(`/roster/candidate/${cand}`);
      assert.deepEqual(conn.body.map((c) => c.capsuleId), ['CC-001']);
      assert.equal((await A().put(`/roster/${r.body.id}`, { capsuleOutcome: 'Pass' })).body.capsuleOutcome, 'Pass');
      assert.equal((await A().put(`/roster/${r.body.id}`, { capsuleOutcome: 'Nope' })).status, 400);
      assert.equal((await A().get(`/roster/capsule/${cap.id}`)).body.length, 2);
      assert.equal((await A().get(`/roster/client/${S.clientA.id}`)).body.length, 2);
    });

    let blocks = [];
    it('CAP-05 assessment blocks get PP IDs 1,2,3 / -1,-2 and only for roster candidates', async () => {
      for (const t of ['Direct', 'Direct', 'Direct', 'Indirect', 'Indirect']) {
        const r = await A().post('/blocks', { capsuleId: cap.id, candidate_id: cand, manageType: t, periodType: 'Week', shortDescription: `${t} block`, delivery: 'Capsule Operations', extra: 'kept' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        blocks.push(r.body);
      }
      assert.deepEqual(blocks.map((b) => b.ppId), [1, 2, 3, -1, -2]);
      assert.equal(blocks[0].extra, 'kept');
      const off = S.candidates.A[2].id; // not on the roster
      assert.equal((await A().post('/blocks', { capsuleId: cap.id, candidate_id: off, manageType: 'Direct' })).status, 400);
      assert.equal((await A().post('/blocks', { capsuleId: cap.id, candidate_id: cand, manageType: 'Sideways' })).status, 400);
    });

    let scores = [];
    it('CAP-06 scores: create, critical date range, attained ≤ max, move follows the block', async () => {
      const base = { capsuleId: cap.id, candidate_id: cand, capacity: 'Cognitive', durationDays: 7.6, attainedScore: 3, maxScore: 5, CM1: 'Yes', CM2: 'No' };
      const mk = (b, d) => A().post('/scores', { ...base, blockId: b.id, criticalRefDate: d });
      let r = await mk(blocks[0], '2026-01-10'); assert.equal(r.status, 201, JSON.stringify(r.body)); scores.push(r.body);
      r = await mk(blocks[1], '2026-01-20'); assert.equal(r.status, 201); scores.push(r.body);
      r = await mk(blocks[2], '2026-02-01'); assert.equal(r.status, 201); scores.push(r.body);
      assert.equal(scores[0].ppId, 1);
      assert.equal(scores[0].CM1, 'Yes');
      assert.equal(scores[0].candidate.id, cand);

      const range = await A().get(`/scores/${cap.id}/${cand}/critical-range?ppId=2`);
      assert.deepEqual(range.body, { ppId: 2, startDate: '2026-01-10', endDate: '2026-02-01' });
      assert.equal((await mk(blocks[1], '2026-03-01')).status, 400);       // after PP 3
      assert.equal((await mk(blocks[1], '2026-01-01')).status, 400);       // before PP 1
      assert.equal((await A().post('/scores', { ...base, blockId: blocks[1].id, criticalRefDate: '2026-01-15', attainedScore: 6 })).status, 400);
      assert.equal((await A().post('/scores', { ...base, blockId: blocks[1].id, criticalRefDate: '2026-01-15', capacity: '' })).status, 400);

      // Move: score of PP 1 takes block 2 and its date
      const m = await A().put(`/scores/${scores[0].id}`, { blockId: blocks[1].id, criticalRefDate: '2026-01-20' });
      assert.equal(m.status, 200, JSON.stringify(m.body));
      assert.equal(m.body.ppId, 2);
      assert.equal(m.body.CM1, 'Yes');
      // back again
      assert.equal((await A().put(`/scores/${scores[0].id}`, { blockId: blocks[0].id, criticalRefDate: '2026-01-10' })).body.ppId, 1);

      const list = await A().get(`/scores/${cap.id}/${cand}`);
      assert.deepEqual(list.body.map((s) => s.ppId), [1, 2, 3]);
    });

    it('CAP-07 block swap moves scores; delete renumbers PP IDs without gaps', async () => {
      // swap PP 1 <-> PP 2 (as the roster Move Up/Down does)
      await A().put(`/blocks/${blocks[0].id}`, { ppId: 2 });
      await A().put(`/blocks/${blocks[1].id}`, { ppId: 1 });
      let s = (await A().get(`/scores/${cap.id}/${cand}`)).body;
      assert.equal(s.find((x) => x.id === scores[0].id).ppId, 2);
      assert.equal((await A().put(`/blocks/${blocks[3].id}`, { ppId: 4 })).status, 400); // indirect block cannot get a positive PP ID
      await A().put(`/blocks/${blocks[0].id}`, { ppId: 1 });
      await A().put(`/blocks/${blocks[1].id}`, { ppId: 2 });

      // delete PP 2 -> old PP 3 becomes 2 and its score follows
      assert.equal((await A().del(`/blocks/${blocks[1].id}`)).status, 200);
      const left = (await A().get(`/blocks/${cap.id}/${cand}`)).body;
      assert.deepEqual(left.filter((b) => b.manageType === 'Direct').map((b) => b.ppId).sort(), [1, 2]);
      s = (await A().get(`/scores/${cap.id}/${cand}`)).body;
      assert.deepEqual(s.map((x) => x.ppId), [1, 2]);
      assert.equal(s.find((x) => x.id === scores[2].id).ppId, 2);
      assert.equal(s.find((x) => x.id === scores[1].id), undefined);
    });

    it('CAP-08 clinical marker names: only CM89–CM100, max 30 characters', async () => {
      const r = await A().put(`/markers/${cap.id}/89`, { name: 'A'.repeat(40) });
      assert.equal(r.status, 200);
      assert.equal(r.body[89].length, 30);
      assert.equal((await A().put(`/markers/${cap.id}/5`, { name: 'x' })).status, 400);
      assert.equal((await A().get(`/markers/${cap.id}`)).body[89].length, 30);
      assert.equal((await B().put(`/markers/${cap.id}/90`, { name: 'x' })).status, 403);
    });

    it('CAP-09 projections and effectivity (partial saves keep the other fields)', async () => {
      const p = await A().post('/projection', { unitId: cap.id, candidateId: cand, points: [{ callout: 'First PP Selection', dayCount: 7 }] });
      assert.equal(p.status, 201);
      await A().put(`/projection/${p.body.session.id}`, { points: [{ callout: 'Second PP Selection', dayCount: 9 }] });
      const ps = (await A().get(`/projection/${cap.id}/${cand}`)).body;
      assert.equal(ps[0].points[0].callout, 'Second PP Selection');

      const e1 = await A().post('/effectivity', { unitId: cap.id, candidateId: cand, ppId: 1, effectivityType: 'Holistic' });
      assert.equal(e1.status, 201);
      const e2 = await A().post('/effectivity', { unitId: cap.id, candidateId: cand, ppId: 1, effectivityGap: 'Capacity' });
      assert.equal(e2.status, 200);
      assert.equal(e2.body.id, e1.body.id);
      assert.equal(e2.body.effectivityType, 'Holistic');
      assert.equal(e2.body.effectivityGap, 'Capacity');
      const bad = await A().post('/effectivity', { unitId: cap.id, candidateId: cand, ppId: 2, effectivityType: 'DROP TABLE' });
      assert.equal(bad.body.effectivityType, null);
      assert.equal((await A().get(`/effectivity/${cap.id}?candidateIds=${cand}`)).body.length, 2);
      assert.equal((await B().post('/effectivity', { unitId: cap.id, candidateId: cand, ppId: 3 })).status, 403);
    });

    it('CAP-10 auxiliary records keep their fields; unknown kinds / other organisations refused', async () => {
      const m = await A().post('/aux/candidateMarks', { unitId: cap.id, candidateId: cand, ppId: 1, marks: [1, 2, 3], note: 'ok' });
      assert.equal(m.status, 201, JSON.stringify(m.body));
      assert.equal(m.body.unitId, cap.id);
      assert.deepEqual(m.body.marks, [1, 2, 3]);
      assert.equal(m.body.ppId, 1);
      const u = await A().put(`/aux/candidateMarks/${m.body.id}`, { note: 'changed' });
      assert.equal(u.body.note, 'changed');
      assert.deepEqual(u.body.marks, [1, 2, 3]);
      const imp = await A().post('/aux/improvements', { unitId: cap.id, text: 'Capsule Improvement Created' });
      assert.equal(imp.status, 201);
      assert.equal(imp.body.candidateId, null);
      assert.equal((await A().post('/aux/whatever', { unitId: cap.id })).status, 400);
      assert.equal((await A().post('/aux/needAssessments', { unitId: cap.id, candidateId: S.candidates.A[2].id })).status, 400);
      assert.equal((await B().get(`/aux/candidateMarks/${cap.id}`)).status, 403);
      assert.equal((await B().del(`/aux/candidateMarks/${m.body.id}`)).status, 403);
      assert.equal((await A().put(`/aux/chains/${m.body.id}`, { note: 'x' })).status, 404);  // wrong kind
      assert.equal((await A().get(`/aux/candidateMarks/${cap.id}?candidateId=${cand}`)).body.length, 1);
    });

    it('CAP-11 the snapshot has every collection of the organisation', async () => {
      const r = await A().get(`/store/${S.clientA.id}`);
      assert.equal(r.status, 200);
      const s = r.body;
      assert.equal(s.capsules.length, 1);
      assert.equal(s.rosters.length, 2);
      assert.ok(s.blocks.length >= 4);
      assert.equal(s.scores.length, 2);
      assert.equal(s.markerNames[cap.id][89].length, 30);
      assert.equal(s.projections.length, 1);
      assert.equal(s.effectivity.length, 2);
      assert.equal(s.auxCandidateMarks.length, 1);
      assert.equal(s.auxImprovements.length, 1);
    });

    it('CAP-12 roster removal clears the candidate data; capsule delete clears everything', async () => {
      const row = (await A().get(`/roster/capsule/${cap.id}`)).body.find((r) => r.candidateId === cand);
      assert.equal((await A().del(`/roster/${row.id}`)).status, 200);
      for (const M of ['CapsuleScore', 'CapsuleBlock']) {
        assert.equal(await db[M].count({ where: { capsuleId: cap.id, candidate_id: cand } }), 0, M);
      }
      for (const M of ['CapsuleEffectivity', 'CapsuleProjection']) {
        assert.equal(await db[M].count({ where: { capsuleId: cap.id, candidateId: cand } }), 0, M);
      }
      assert.equal(await db.CapsuleAuxRecord.count({ where: { capsuleId: cap.id, candidateId: cand } }), 0);
      assert.equal(await db.CapsuleAuxRecord.count({ where: { capsuleId: cap.id } }), 1); // capsule-level improvement stays

      assert.equal((await A().del(`/${cap.id}`)).status, 200);
      for (const M of ['CapsuleRoster', 'CapsuleAuxRecord', 'CapsuleMarkerName', 'CapsuleBenchmark', 'CapsuleStaff']) {
        assert.equal(await db[M].count({ where: { capsuleId: cap.id } }), 0, M);
      }
      assert.equal((await A().get(`/id/${cap.id}`)).status, 404);
    });
  });
}
