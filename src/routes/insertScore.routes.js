const express = require('express');
const router = express.Router();
const insertScoreController = require('../controllers/insertScore.controller');

router.get('/', insertScoreController.getInsertScores);
// router.get('/unit/:unitId', assessmentBlockController.getAssessmentBlocksByUnitId);
router.post('/', insertScoreController.createInsertScore);
router.put('/:id', insertScoreController.updateInsertScore);
router.delete('/:id', insertScoreController.deleteInsertScore);
router.get('/unit/:unitId', insertScoreController.getInsertScoresByUnitId);
router.get('/block/:blockId', insertScoreController.getInsertScoresByBlockId);
router.get('/unit/:unitId/candidate/:candidate_id', insertScoreController.getInsertScoresByUnitAndCandidate)

module.exports = router;