const express = require('express');
const router = express.Router();
const ethinicityController = require('../controllers/ethinicity.controller');

router.get('/:clientId', ethinicityController.getEthinicities);
router.get('/id/:id', ethinicityController.getEthinicityById);
router.post('/', ethinicityController.createEthinicity);
router.put('/:id', ethinicityController.updateEthinicity);
router.delete('/:id', ethinicityController.deleteEthinicity);

module.exports = router;