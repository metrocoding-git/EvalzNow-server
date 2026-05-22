const express = require('express');
const router = express.Router();
const neuroScienceController = require('../controllers/neuroScience.controller');
const { route } = require('./user.routes');

router.post('/', neuroScienceController.createNeuroScience);
router.get('/:unitId/:candidateId', neuroScienceController.getNeuroScienceSessionsByUnitAndCandidate);
router.get('/rms/:unitId/:candidateId', neuroScienceController.getNeuroScienceRmsValues);
router.put('/:sessionId', neuroScienceController.updateNeuroScience);

module.exports = router;