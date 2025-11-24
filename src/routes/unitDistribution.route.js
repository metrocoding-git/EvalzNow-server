const express = require('express');
const router = express.Router();
const unitDistribution = require('../controllers/unitDistribution.controller');

router.get('/', unitDistribution.getNormalDistributionData);

module.exports = router;