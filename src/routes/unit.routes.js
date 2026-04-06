const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const auth = require('../middlewares/authentication.middleware');

router.get('/:clientId', auth.authenticateToken, unitController.getUnits);
router.get('/id/:id', auth.authenticateToken, unitController.getUnitById);
router.post('/', unitController.createUnit);
router.put('/:id', unitController.updateUnit);
router.delete('/:id', unitController.deleteUnit);

module.exports = router;