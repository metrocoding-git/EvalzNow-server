const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const auth = require('../middlewares/authentication.middleware');

router.get('/:clientId', auth.authenticateToken, staffController.getStaff);
router.get('/id/:id', auth.authenticateToken, staffController.getStaffById);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;