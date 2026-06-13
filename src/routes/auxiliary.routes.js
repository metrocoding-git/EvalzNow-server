const express = require('express');
const router = express.Router();
const auxiliaryResultant = require('../controllers/auxiliaryResultant.controller');

router.get('/unit/:unitId/candidate/:candidate_id', auxiliaryResultant.getAuxiliaryGraphData);
router.get('/marks/:unitId/:candidate_id', auxiliaryResultant.getCandidateMarks);
router.get('/assessment/:unitId/:candidate_id', auxiliaryResultant.getCandidateNeedAssessments);
router.get('/assessment/summary/:unitId/:candidate_id', auxiliaryResultant.getNeedAssessmentStatusSummary);
router.get('/lesson/:unitId', auxiliaryResultant.getLessonImprovements);
router.get('/leader/:unitId', auxiliaryResultant.getLeaderMarks);
router.get('/effort/:unitId/:candidate_id', auxiliaryResultant.getEffortBu);
router.get('/chain/:unitId/:candidateId', auxiliaryResultant.getAssessmentChainData);
router.get('/chain/:id', auxiliaryResultant.getAssessmentChainById);
router.put('/lesson/:id', auxiliaryResultant.updateLessonImprovement);
router.post('/marks', auxiliaryResultant.createCandidateMarks);
router.post('/assessment', auxiliaryResultant.createCandidateNeedAssessment);
router.post('/lesson', auxiliaryResultant.createLessonImprovement);
router.post('/leader', auxiliaryResultant.createLeaderMarks);
router.post('/chain', auxiliaryResultant.createAssessmentChain);
router.put('/assessment/:id', auxiliaryResultant.updateCandidateNeedAssessment);
router.put('/chain/:id', auxiliaryResultant.updateAssessmentChain);
router.put('/marks/:id', auxiliaryResultant.updateCandidateMark);
router.put('/leader/:id', auxiliaryResultant.updateLeaderMarks);
router.delete('/assessment/:id', auxiliaryResultant.deleteCandidateNeedAssessment);
router.delete('/lesson/:id', auxiliaryResultant.deleteUnitImprovement);
router.delete('/chain/:id', auxiliaryResultant.deleteAssessmentChain);

module.exports = router;