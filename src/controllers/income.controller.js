// controllers/income.controller.js
const db = require("../models");
const Income = db.Income;

// Create a new Income
exports.createIncome = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const income = await Income.create({ name });
    return res.status(201).json(income);
  } catch (error) {
    console.error("Error creating income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all Incomes
exports.getAllIncomes = async (req, res) => {
  try {
    const incomes = await Income.findAll({ order: [["id", "ASC"]] });
    return res.status(200).json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get Income by ID
exports.getIncomeById = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findByPk(id);

    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    return res.status(200).json(income);
  } catch (error) {
    console.error("Error fetching income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update Income
exports.updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const income = await Income.findByPk(id);
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    income.name = name || income.name;
    await income.save();

    return res.status(200).json(income);
  } catch (error) {
    console.error("Error updating income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete Income
exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findByPk(id);

    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    await income.destroy();
    return res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Error deleting income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
