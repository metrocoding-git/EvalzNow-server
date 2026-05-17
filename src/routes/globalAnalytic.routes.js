const express = require('express');
const router = express.Router();
const globalAnalytics = require('../controllers/globalAnalytics.controller');

router.get('/:clientId', globalAnalytics.getGlobalAnalyticsDataByUnit);
router.get('/thres/:clientId', globalAnalytics.getUnitSuccessRatesByThreshold);
router.get('/stable/:clientId', globalAnalytics.getCandidateStableCounts);
router.get('/ic/:clientId', globalAnalytics.getClientIcDistribution);
router.get('/ur/:clientId', globalAnalytics.getClientProductivityDistribution);
// router.post('/', globalAnalytics.createEthinicity);
// router.put('/:id', globalAnalytics.updateEthinicity);
// router.delete('/:id', globalAnalytics.deleteEthinicity);

module.exports = router;