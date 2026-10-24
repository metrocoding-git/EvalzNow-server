/**
 * Effectivity module tests: parameter math (vs. the Excel sheet), tenant isolation
 * and saving. Needs TEST_ALLOW_DB_RESET=1 and a dedicated test database.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const fx = require('../src/utils/effectivity');

// Values of "New Work Requirements.xlsx" > Effectivity_Part2 at RRN = PRN = ARN = 0.75
const EXCEL_CICO_TP = [0.05826736797879972, -0.05719095841793653, -0.057190958417936755, -0.1600526334034179, -0.17595468166680683,
  -0.33333333333333337, -0.33333333333333337, -0.33333333333333337, -0.6666666666666667, -0.6666666666666667];
const EXCEL_TPRM = [-0.07551830086582045, -0.23019964108049895, -0.33333333333333337, -0.33333333333333337, -0.44771525016920677,
  -0.5285954792089683, -0.5555555555555556, -0.7238576250846034, -0.8333333333333334, -1.6666666666666665];

describe('Effectivity parameter math', () => {
  it('EFF-01 matches the Excel formulas (CICO/T&P use ARN = 0)', () => {
    fx.rawParameters(0.75, 0.75, 0).forEach((v, i) => assert.ok(Math.abs(v - EXCEL_CICO_TP[i]) < 1e-12, `P${i + 1}`));
    fx.rawParameters(0.75, 0.75, 0.75).forEach((v, i) => assert.ok(Math.abs(v - EXCEL_TPRM[i]) < 1e-12, `P${i + 1}`));
  });

  it('EFF-02 thresholds are the fixed 3-decimal values', () => {
    assert.deepEqual(fx.getThresholds('Communicative I/O'), EXCEL_CICO_TP.map((v) => Number(v.toFixed(3))));
    assert.deepEqual(fx.getThresholds('Theory & Practice'), EXCEL_CICO_TP.map((v) => Number(v.toFixed(3))));
    assert.deepEqual(fx.getThresholds('Third Parameter'), EXCEL_TPRM.map((v) => Number(v.toFixed(3))));
  });

  it('EFF-03 values above 5 / infinity / not-a-number become 5', () => {
    assert.deepEqual(fx.computeParameters(0, 0, 0, 'Third Parameter'), Array(10).fill(5));
    assert.equal(fx.computeParameters(0.1, 0.1, null, 'Communicative I/O')[0], 5);
  });

  it('EFF-04 ARN is ignored for CICO / T&P and required for Third Parameter', () => {
    assert.deepEqual(fx.computeParameters(0.6, 0.5, 0.9, 'Theory & Practice'), fx.computeParameters(0.6, 0.5, 0, 'Theory & Practice'));
    assert.equal(fx.computeParameters(0.6, 0.5, null, 'Third Parameter'), null);
  });

  it('EFF-05 pass = value ≤ threshold', () => {
    const t = fx.getThresholds('Third Parameter');
    assert.deepEqual(fx.passFlags(fx.computeParameters(0.75, 0.75, 0.75, 'Third Parameter'), t), Array(10).fill(true));
    assert.deepEqual(fx.passFlags(fx.computeParameters(0.3, 0.3, 0.3, 'Third Parameter'), t), Array(10).fill(false));
  });

  it('EFF-06 unknown drop-down values are not stored', () => {
    assert.deepEqual(fx.sanitizeFields({ effectivityType: 'Holistic', effectivityGap: 'DROP TABLE' }), { effectivityType: 'Holistic', effectivityGap: null });
  });
});

if (process.env.TEST_ALLOW_DB_RESET === '1') {
  const app = require('../src/app');
  const db = require('../src/models');
  const { seed, PASSWORD } = require('./helpers/seed');
  const { ensureDb } = require('../src/config/ensureDb');
  const API = '/api/v1';
  let S; const T = {};
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const login = async (u) => (await request(app).post(`${API}/account`).send({ username: u, password: PASSWORD })).body.token;

  describe('Effectivity API', () => {
    before(async () => {
      S = await seed({ candidatesPerClient: 3, scoresPerCandidate: 6 });
      await ensureDb();
      T.adminA = await login('admina@test.com');
      T.adminB = await login('adminb@test.com');
    });
    after(async () => { await db.sequelize.close(); });

    it('EFF-10 save, update and read a candidate effectivity object', async () => {
      const body = { unitId: S.units.A.id, candidateId: S.candidates.A[0].id, ppId: 2, effectivityType: 'Holistic', effectivitySegment: 'Training' };
      const r1 = await request(app).post(`${API}/effectivity`).set(auth(T.adminA)).send(body);
      assert.equal(r1.status, 201);
      const r2 = await request(app).post(`${API}/effectivity`).set(auth(T.adminA)).send({ ...body, effectivityType: 'Reactive Dominant' });
      assert.equal(r2.status, 200);
      assert.equal(r2.body.id, r1.body.id);
      const r3 = await request(app).get(`${API}/effectivity/candidate/${S.units.A.id}/${S.candidates.A[0].id}`).set(auth(T.adminA));
      assert.equal(r3.status, 200);
      const row = r3.body.rows.find((x) => x.ppId === 2);
      assert.equal(row.effectivityType, 'Reactive Dominant');
      // the base seed has no RRN/PRN competencies -> parameters are null (no scores to calculate from)
      assert.ok(row.parameters === null || row.parameters.length === 10);
      assert.equal(r3.body.thresholds.length, 10);
    });

    it('EFF-11 another organisation cannot read or write it', async () => {
      const cand = S.candidates.A[0].id;
      assert.equal((await request(app).get(`${API}/effectivity/candidate/${S.units.A.id}/${cand}`).set(auth(T.adminB))).status, 403);
      assert.equal((await request(app).get(`${API}/effectivity/unit/${S.units.A.id}`).set(auth(T.adminB))).status, 403);
      assert.equal((await request(app).post(`${API}/effectivity`).set(auth(T.adminB)).send({ unitId: S.units.A.id, candidateId: cand, ppId: 3 })).status, 403);
      const row = await db.EffectivityResponse.findOne({ where: { unitId: S.units.A.id } });
      assert.equal((await request(app).delete(`${API}/effectivity/${row.id}`).set(auth(T.adminB))).status, 403);
    });

    it('EFF-12 candidates outside the unit roster are refused', async () => {
      const r = await request(app).post(`${API}/effectivity`).set(auth(T.adminA))
        .send({ unitId: S.units.A.id, candidateId: 999999, ppId: 1, effectivityType: 'Holistic' });
      assert.ok([400, 403].includes(r.status));
    });

    it('EFF-13 unit level returns pass fractions and type split', async () => {
      const r = await request(app).get(`${API}/effectivity/unit/${S.units.A.id}`).set(auth(T.adminA));
      assert.equal(r.status, 200);
      assert.equal(r.body.passFractions.length, 10);
      assert.ok(r.body.typeBreakdown.total >= 1);
    });
  });
}
