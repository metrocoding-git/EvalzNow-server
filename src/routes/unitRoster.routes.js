const express = require('express');
const router = express.Router();
const UnitRosterController = require('../controllers/unitRoster.controller');

router.get('/', UnitRosterController.getUnitRosters);
router.post('/', UnitRosterController.createUnitRoster);
router.put('/:id', UnitRosterController.updateUnitRoster);
router.delete('/:id', UnitRosterController.deleteUnitRoster);

module.exports = router;