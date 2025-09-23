const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const auth = require('../middlewares/authentication.middleware');

router.get('/', auth.authenticateToken, clientController.getClients);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;