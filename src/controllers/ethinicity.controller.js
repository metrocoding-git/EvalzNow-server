const db = require('../models');
const Ethinicity = db.Ethinicity;
const Client = db.Client;

// GET all ethinicities
exports.getEthinicities = async (req, res) => {
  try {
    const { clientId } = req.params;

    // ✅ Ensure client belongs to this account
    const client = await Client.findOne({
      where: { id: clientId },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found or not in your account" });
    }

    const ethinicities = await Ethinicity.findAll({
      where: { clientId: clientId },
    });
    res.status(200).json(ethinicities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching ethinicities', error: error.message });
  }
};

// GET single ethinicity by ID
exports.getEthinicityById = async (req, res) => {
  try {
    const { id } = req.params;
    const ethinicity = await Ethinicity.findOne({ where: { id } });

    if (!ethinicity) {
      return res.status(404).json({ message: 'Ethinicity not found' });
    }

    res.status(200).json(ethinicity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching ethinicity', error: error.message });
  }
};

// POST create a new ethinicity
exports.createEthinicity = async (req, res) => {
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

    const newEthinicity = await Ethinicity.create({ name, clientId });
    res.status(201).json(newEthinicity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating ethinicity', error: error.message });
  }
};

// PUT update an ethinicity
exports.updateEthinicity = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Ethinicity.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Ethinicity not found or no changes made' });
    }

    const updatedEthinicity = await Ethinicity.findOne({ where: { id } });
    res.status(200).json(updatedEthinicity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating ethinicity', error: error.message });
  }
};

// DELETE an ethinicity
exports.deleteEthinicity = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Ethinicity.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Ethinicity not found' });
    }

    res.status(200).json({ message: 'Ethinicity deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting ethinicity', error: error.message });
  }
};
