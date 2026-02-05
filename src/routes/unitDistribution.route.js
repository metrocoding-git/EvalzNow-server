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
router.get('/chi-dist', chiSquareDistribution.getChiDistributionData);
router.get('/f-dist', unitFDistribution.getFDistributionData);
router.get('/beta-dist', unitbetaDistribution.getBetaDistributionData);
router.get('/uniform-dist', unitUniformDistribution.getUniformDistributionData);
router.get('/weibull-cdf-dist', weibullDistributionCDF.getWeibullCDFDistributionData);
router.get('/weibull-pdf-dist', weibullDistributionPDF.getWeibullPDFDistributionData);
router.get('/weibull-risk-dist', weibullDistributionRISK.getWeibullRiskDistributionData);

module.exports = router;