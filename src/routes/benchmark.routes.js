const express = require('express');
const router = express.Router();
const benchmarkController = require('../controllers/irregularity.controller');

// Get all irregularities
router.get('/', benchmarkController.getIrregularities);

// Get a single irregularity by ID
router.get('/:id', benchmarkController.getIrregularityById);

// Create a new irregularity
router.post('/', benchmarkController.createIrregularity);

// Update an existing irregularity
router.put('/:id', benchmarkController.updateIrregularity);

// Delete an irregularity
router.delete('/:id', benchmarkController.deleteIrregularity);

module.exports = router;
