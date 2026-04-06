const express = require('express');
const router = express.Router();
const UnitRosterController = require('../controllers/unitRoster.controller');

router.get('/', UnitRosterController.getUnitRosters);
router.get('/unit/:unitId', UnitRosterController.getUnitRostersByUnitId);
router.get('/unit/:unitId/candidate/:candidateId', UnitRosterController.getUnitRostersByUnitIdAndCandidateId);
router.get('/candidate/:candidateId', UnitRosterController.getUnitsByCandidateId);
router.post('/', UnitRosterController.createUnitRoster);
router.put('/:id', UnitRosterController.updateUnitRoster);
router.delete('/:id', UnitRosterController.deleteUnitRoster);

module.exports = router;