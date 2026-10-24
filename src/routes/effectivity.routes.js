const express = require('express');
const router = express.Router();
const effectivity = require('../controllers/effectivity.controller');

router.get('/options', effectivity.getOptions);
router.get('/candidate/:unitId/:candidateId', effectivity.getCandidateEffectivity);
router.get('/unit/:unitId', effectivity.getUnitEffectivity);
router.get('/client/:clientId', effectivity.getClientEffectivity);
router.post('/', effectivity.saveEffectivity);
router.put('/:id', effectivity.updateEffectivity);
router.delete('/:id', effectivity.deleteEffectivity);

module.exports = router;
