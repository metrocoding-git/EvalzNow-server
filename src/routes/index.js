const express = require('express');
const router = express.Router();

router.use('/users', require('./user.routes'));
router.use('/clients', require('./client.routes'));
router.use('/company', require('./companySize.routes'));
router.use('/staffs', require('./staff.routes'));
router.use('/candidates', require('./candidate.routes'));
router.use('/irregulaties', require('./irregularity.routes'));
router.use('/units', require('./unit.routes'));
router.use('/benchmark', require('./benchmark.routes'));
router.use('/unit_roster', require('./unitRoster.routes'));
router.use('/assessment_block_manager', require('./assessmentBlockManager.routes'));
router.use('/ethinicity', require('./ethinicity.routes'));
router.use('/income', require('./income.routes'));
router.use('/insert-score', require('./insertScore.routes'));
router.use('/scoring-criteria', require('./scoringCriteria.routes'));
router.use('/scoring-trends', require('./scoringTrends.routes'));
router.use('/tabulation', require('./tabulationTable.routes'));

module.exports = router;
