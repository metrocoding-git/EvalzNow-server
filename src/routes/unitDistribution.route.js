const express = require('express');
const router = express.Router();
const unitDistribution = require('../controllers/unitNormalDistribution.controller');
const unitTDistribution = require('../controllers/unitTDistribution.controller');
const unitExponentialDistribution = require('../controllers/unitExponentialDistribution.controller');
const chiSquareDistribution = require('../controllers/chiSquareDistribution.controller');
const unitFDistribution = require('../controllers/unitFDistribution.controller');
const unitbetaDistribution = require('../controllers/betaDistribution.controller');
const unitUniformDistribution = require('../controllers/unitUniformDistribution.controller');
const weibullDistributionCDF = require('../controllers/weibullDistributionCDF.controller');
const weibullDistributionPDF = require('../controllers/weibullDistributionPDF.controller');
const weibullDistributionRISK = require('../controllers/weibullDistributionRISK.controller');

router.post('/normal-dist', unitDistribution.getNormalDistributionData);
router.post('/t-dist', unitTDistribution.getTDistributionData);
router.get('/exponential-dist', unitExponentialDistribution.getExponetialDistributionData);
router.post('/chi-dist', chiSquareDistribution.getChiDistributionData);
router.post('/f-dist', unitFDistribution.getFDistributionData);
router.post('/beta-dist', unitbetaDistribution.getBetaDistributionData);
router.post('/uniform-dist', unitUniformDistribution.getUniformDistributionData);
router.post('/weibull-cdf-dist', weibullDistributionCDF.getWeibullCDFDistributionData);
router.post('/weibull-pdf-dist', weibullDistributionPDF.getWeibullPDFDistributionData);
router.post('/weibull-risk-dist', weibullDistributionRISK.getWeibullRiskDistributionData);

module.exports = router;