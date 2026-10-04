const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { authenticateToken, requireRole } = require('../middlewares/authentication.middleware');
const { loginLimiter, recoveryLimiter, noStore } = require('../middlewares/security.middleware');

router.use(noStore);

// Public
router.post('/', loginLimiter, accountController.login);
router.post('/recover', recoveryLimiter, accountController.recoverAccount);
router.post('/reset-password', recoveryLimiter, accountController.resetPassword);

// Authenticated
router.get('/me', authenticateToken, accountController.getCurrentUser);
router.post('/logout', authenticateToken, accountController.logout);
router.post('/logout-all', authenticateToken, accountController.logoutAll);
// Creating raw login accounts (any role) is a platform-owner action only.
router.post('/create', authenticateToken, requireRole('super admin'), accountController.createAccount);

module.exports = router;
