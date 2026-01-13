const express = require('express');
const router = express.Router();
const dataReport = require('../controllers/dataReport.controller');

router.get('/:unitId/:candidateId', dataReport.getDataReportByUnitCandidate);
router.get('/all/:unitId', dataReport.getDataReportByUnitAllCandidates);
// router.get('/all/:clientId/:candidateId', dataExtract.getDataExtractionByCandidateId);

module.exports = router;