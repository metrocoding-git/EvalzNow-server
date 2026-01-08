const express = require('express');
const router = express.Router();
const dataExtract = require('../controllers/dataExtraction.controller');

router.get('/:unitId', dataExtract.getInsertScoresByUnitId);
router.get('/all/:clientId', dataExtract.getInsertScoresByClientId);

module.exports = router;