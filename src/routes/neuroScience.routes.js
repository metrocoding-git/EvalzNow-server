const express = require('express');
const router = express.Router();
const neuroScienceController = require('../controllers/neuroScience.controller');

router.post('/', neuroScienceController.createNeuroScience);
// Must be registered before '/:unitId/:candidateId' (same number of segments).
router.get('/matrix/:unitId', neuroScienceController.getCognitiveMatrixByUnit);
router.get('/:unitId/:candidateId', neuroScienceController.getNeuroScienceSessionsByUnitAndCandidate);
router.get('/rms/:unitId/:candidateId', neuroScienceController.getNeuroScienceRmsValues);
router.put('/:sessionId', neuroScienceController.updateNeuroScience);

module.exports = router;