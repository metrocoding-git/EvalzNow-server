const express = require('express');
const router = express.Router();
const companySizeController = require('../controllers/companySize.controller');

router.get('/', companySizeController.getCompanySize);
// router.post('/', clientController.createClient);
// router.put('/:id', clientController.updateClient);
// router.delete('/:id', clientController.deleteClient);

module.exports = router;