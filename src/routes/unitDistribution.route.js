const express = require('express');
const router = express.Router();
const unitDistribution = require('../controllers/unitNormalDistribution.controller');
const unitTDistribution = require('../controllers/unitTDistribution.controller');
const unitExponentialDistribution = require('../controllers/unitExponentialDistribution.controller');

router.post('/normal-dist', unitDistribution.getNormalDistributionData);
router.post('/t-dist', unitTDistribution.getTDistributionData);
router.post('/exponential-dist', unitExponentialDistribution.getExponetialDistributionData);

module.exports = router;