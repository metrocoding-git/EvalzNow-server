const express = require('express');
const router = express.Router();

const { authenticateToken, requireRole, requireManager } = require('../middlewares/authentication.middleware');
const { guardRouter, tenantQueryBodyGuard, superAdminOnly } = require('../middlewares/tenant.middleware');
const { noStore } = require('../middlewares/security.middleware');

// ---------------------------------------------------------------------------
// Public endpoints (login / password recovery). Everything else needs a token.
// ---------------------------------------------------------------------------
router.use('/account', require('./account.routes'));

// From here on: every request must carry a valid, non-revoked token.
router.use(authenticateToken, noStore);

// Helpers ------------------------------------------------------------------
const writesOnly = (mw) => (req, res, next) => (req.method === 'GET' ? next() : mw(req, res, next));
// "GET /" on these routers returns every organisation's rows -> super admin only.
const rootListSuperOnly = (req, res, next) =>
  (req.method === 'GET' && (req.path === '/' || req.path === '')) ? superAdminOnly(req, res, next) : next();

const mount = (path, file, { idModel, sessionModel, ignoreBody = [], extra = [] } = {}) => {
  const r = guardRouter(require(file), { idModel, sessionModel });
  router.use(path, ...extra, tenantQueryBodyGuard(ignoreBody), r);
};

// Auxiliary router uses ":id" for several different record types.
const auxIdModel = (req) => ({
  lesson: 'UnitImprovement',
  marks: 'CandidateMarks',
  leader: 'LeaderMarks',
  assessment: 'CandidateNeedAssessment',
  chain: 'AssessmentChain',
}[String(req.path).split('/')[1]]);

// Routes -------------------------------------------------------------------
// (/users removed: it exposed a non-existent model and crashed with a 500.)
mount('/clients', './client.routes', { idModel: 'Client', extra: [writesOnly(requireRole('super admin'))] });
mount('/company', './companySize.routes');
mount('/staffs', './staff.routes', { idModel: 'Staff', extra: [writesOnly(requireManager)] });
mount('/candidates', './candidate.routes', { idModel: 'Candidate', ignoreBody: ['candidateId'] });
mount('/irregulaties', './irregularity.routes', { idModel: 'Irregularity', extra: [rootListSuperOnly] });
mount('/units', './unit.routes', { idModel: 'Unit', ignoreBody: ['unitId'] });
mount('/benchmark', './benchmark.routes', { idModel: 'Benchmark', extra: [rootListSuperOnly] });
mount('/unit_roster', './unitRoster.routes', { idModel: 'UnitRoster' });
mount('/assessment_block_manager', './assessmentBlockManager.routes', { idModel: 'AssessmentBlockManager', extra: [rootListSuperOnly] });
mount('/ethinicity', './ethinicity.routes', { idModel: 'Ethinicity' });
mount('/income', './income.routes', { idModel: 'Income' });
mount('/insert-score', './insertScore.routes', { idModel: 'InsertScore', extra: [rootListSuperOnly] });
mount('/scoring-criteria', './scoringCriteria.routes', { idModel: 'ScoringCriteria', extra: [rootListSuperOnly] });
mount('/scoring-trends', './scoringTrends.routes');
mount('/tabulation', './tabulationTable.routes');
mount('/projection', './projection.routes', { idModel: 'ProjectionSession', sessionModel: 'ProjectionSession' });
mount('/unit-distribution', './unitDistribution.route');
mount('/auxiliary', './auxiliary.routes', { idModel: auxIdModel });
mount('/neuro-science', './neuroScience.routes', { sessionModel: 'NeuroScienceSession' });
mount('/global-analytics', './globalAnalytic.routes');
mount('/effectivity', './effectivity.routes', { idModel: 'EffectivityResponse' });
mount('/data-extract', './dataExtraction.routes');
mount('/data-report', './dataReport.routes');

module.exports = router;
