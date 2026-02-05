const express = require('express');
const router = express.Router();
const scoringCriteria = require('../controllers/scoringCriteria.controller');

router.get('/', scoringCriteria.getAllScoringCriteria);
// router.get('/unit/:unitId', assessmentBlockController.getAssessmentBlocksByUnitId);
router.post('/', scoringCriteria.createScoringCriteria);
router.put('/:id', scoringCriteria.updateScoringCriteria);
router.delete('/:id', scoringCriteria.deleteScoringCriteria);
router.get('/unit/:unitId', scoringCriteria.getScoringCriteriaByUnit);

module.exports = router;