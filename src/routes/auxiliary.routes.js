const express = require('express');
const router = express.Router();
const auxiliaryResultant = require('../controllers/auxiliaryResultant.controller');

router.get('/unit/:unitId/candidate/:candidate_id', auxiliaryResultant.getAuxiliaryGraphData);
router.get('/marks/:unitId/:candidate_id', auxiliaryResultant.getCandidateMarks);
router.get('/assessment/:unitId/:candidate_id', auxiliaryResultant.getCandidateNeedAssessments);
router.get('/assessment/summary/:unitId/:candidate_id', auxiliaryResultant.getNeedAssessmentStatusSummary);
router.get('/lesson/:unitId/:candidate_id', auxiliaryResultant.getLessonImprovements);
router.get('/leader/:unitId/:candidate_id', auxiliaryResultant.getLeaderMarks);
router.get('/effort/:unitId/:candidate_id', auxiliaryResultant.getEffortBu);
router.get('/chain/:unitId/:candidateId', auxiliaryResultant.getAssessmentChainData);
router.put('/lesson/:id', auxiliaryResultant.updateLessonImprovement);
router.post('/marks', auxiliaryResultant.createCandidateMarks);
router.post('/assessment', auxiliaryResultant.createCandidateNeedAssessment);
router.post('/lesson', auxiliaryResultant.createLessonImprovement);
router.post('/leader', auxiliaryResultant.createLeaderMarks);
router.post('/chain', auxiliaryResultant.createAssessmentChain);
router.put('/assessment/:id', auxiliaryResultant.updateCandidateNeedAssessment);
router.delete('/assessment/:id', auxiliaryResultant.deleteCandidateNeedAssessment);
router.delete('/lesson/:id', auxiliaryResultant.deleteUnitImprovement);

module.exports = router;