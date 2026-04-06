const express = require('express');
const router = express.Router();
const dataReport = require('../controllers/dataReport.controller');

router.get('/global/:clientId', dataReport.getGlobalDataReportByClient);
router.get('/unit-level/:unitId', dataReport.getDataReportByUnit);
router.get('/candidate-level/:unitId', dataReport.getDataReportByUnitAllCandidates);
router.get('/client-level/:clientId', dataReport.getDataReportByClient);
router.get('/:unitId/:candidateId', dataReport.getDataReportByUnitCandidate);

module.exports = router;