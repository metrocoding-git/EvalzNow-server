const express = require('express');
const router = express.Router();
const unitDistribution = require('../controllers/unitNormalDistribution.controller');
const unitTDistribution = require('../controllers/unitTDistribution.controller');
const unitExponentialDistribution = require('../controllers/unitExponentialDistribution.controller');
const chiSquareDistribution = require('../controllers/chiSquareDistribution.controller');
const unitFDistribution = require('../controllers/unitFDistribution.controller');
const unitbetaDistribution = require('../controllers/betaDistribution.controller');

router.post('/normal-dist', unitDistribution.getNormalDistributionData);
router.post('/t-dist', unitTDistribution.getTDistributionData);
router.get('/exponential-dist', unitExponentialDistribution.getExponetialDistributionData);
router.get('/chi-dist', chiSquareDistribution.getChiDistributionData);
router.get('/f-dist', unitFDistribution.getFDistributionData);
router.get('/beta-dist', unitbetaDistribution.getBetaDistributionData);

module.exports = router;