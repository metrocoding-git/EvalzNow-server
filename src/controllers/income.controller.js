// controllers/income.controller.js
const db = require("../models");
const Income = db.Income;
const Client = db.Client;

// Create a new Income
exports.createIncome = async (req, res) => {
  try {
    const { name, clientId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const client = await db.Client.findOne({
      where: { id: clientId},
    });
    if (!client) {
      return res.status(400).json({ message: "Invalid clientId for this account" });
    }

    const income = await Income.create({ name, clientId });
    return res.status(201).json(income);
  } catch (error) {
    console.error("Error creating income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all Incomes
exports.getAllIncomes = async (req, res) => {
  try {
    const { clientId } = req.params;

    // ✅ Ensure client belongs to this account
    const client = await Client.findOne({
      where: { id: clientId },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found or not in your account" });
    }
    const incomes = await Income.findAll({ where: { clientId: clientId } });
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
    const income = await Income.findOne({ where: { id } });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
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
    const updated = await Income.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Income not found or no changes made' });
    }

    const updatedIncome = await Income.findOne({ where: { id } });
    res.status(200).json(updatedIncome);
  } catch (error) {
    console.error("Error updating income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete Income
exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Income.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.status(200).json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error("Error deleting income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
