const express = require('express');
const router = express.Router();
const auxiliaryResultant = require('../controllers/auxiliaryResultant.controller');

router.get('/unit/:unitId/candidate/:candidate_id', auxiliaryResultant.getAuxiliaryGraphData);

module.exports = router;