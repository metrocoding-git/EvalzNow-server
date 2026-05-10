const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { authenticateToken } = require('../middlewares/authentication.middleware');

router.post('/', accountController.login);
router.post('/create', accountController.createAccount);
router.get("/me", authenticateToken, accountController.getCurrentUser);
router.post("/recover", accountController.recoverAccount);
router.post("/reset-password", accountController.resetPassword);
// router.put('/:id', clientController.updateClient);
// router.delete('/:id', clientController.deleteClient);

module.exports = router;