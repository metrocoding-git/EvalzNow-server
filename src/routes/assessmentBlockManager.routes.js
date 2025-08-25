const express = require('express');
const router = express.Router();
const assessmentBlockController = require('../controllers/assessmentBlockManager.controller');

router.get('/', assessmentBlockController.getAssessmentBlocks);
router.get('/unit/:unitId', assessmentBlockController.getAssessmentBlocksByUnitId);
router.post('/', assessmentBlockController.createAssessmentBlock);
router.put('/:id', assessmentBlockController.updateAssessmentBlock);
router.delete('/:id', assessmentBlockController.deleteAssessmentBlock);
router.get('/unit/:unitId/candidate/:candidateId', assessmentBlockController.getAssessmentBlockByCandidateAndUnit);

module.exports = router;