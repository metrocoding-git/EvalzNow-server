const express = require('express');
const router = express.Router();
const benchmarkController = require('../controllers/benchmark.controller');

// Get all irregularities
router.get('/', benchmarkController.getBenchmarks);

// Get a single irregularity by ID
router.get('/:id', benchmarkController.getBenchmarkById);

// Create a new irregularity
router.post('/', benchmarkController.createBenchmark);

// Update an existing irregularity
router.put('/:id', benchmarkController.updateBenchmark);

// Delete an irregularity
router.delete('/:id', benchmarkController.deleteBenchmark);

module.exports = router;
