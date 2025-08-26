const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/income.controller');

router.get('/', incomeController.getAllIncomes);
router.get('/:id', incomeController.getIncomeById);
router.post('/', incomeController.createIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;