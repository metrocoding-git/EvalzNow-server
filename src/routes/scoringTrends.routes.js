const express = require('express');
const router = express.Router();
const ScoringTrendController = require('../controllers/scoringTrends.controller');


router.get('/', ScoringTrendController.getInsertScoreSummary);
router.get('/se', ScoringTrendController.getInsertScoreSequential);
router.get('/attained-score', ScoringTrendController.getAttainedScoreSummary);
router.get('/max-score', ScoringTrendController.getMaxScoreSummary);

module.exports = router;