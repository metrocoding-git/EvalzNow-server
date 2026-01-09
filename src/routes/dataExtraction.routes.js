const express = require('express');
const router = express.Router();
const dataExtract = require('../controllers/dataExtraction.controller');

router.get('/:unitId', dataExtract.getDataExtractionByUnitId);
router.get('/all/:clientId', dataExtract.getDataExtractionByClientId);
router.get('/all/:clientId/:candidateId', dataExtract.getDataExtractionByCandidateId);

module.exports = router;