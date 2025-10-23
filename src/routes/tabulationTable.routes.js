const express = require('express');
const router = express.Router();
const tabulationController = require('../controllers/tabulationTable.controller');


// router.get('/:unitId/:candidateId', tabulationController.getUnitAndCandidateSummary);
router.get('/ratio', tabulationController.getPpCompetencyRatios);


module.exports = router;