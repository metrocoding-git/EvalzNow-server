const express = require('express');
const router = express.Router();
const IrregularityController = require('../controllers/irregularity.controller');

// Get all irregularities
router.get('/', IrregularityController.getIrregularities);

// Get a single irregularity by ID
router.get('/:id', IrregularityController.getIrregularityById);

// Create a new irregularity
router.post('/', IrregularityController.createIrregularity);

// Update an existing irregularity
router.put('/:id', IrregularityController.updateIrregularity);

// Delete an irregularity
router.delete('/:id', IrregularityController.deleteIrregularity);

module.exports = router;
