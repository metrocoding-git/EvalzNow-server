const db = require('../models');
const Client = db.Client;
const CompanySize = db.CompanySize;

// GET all clients
exports.getCompanySize = async (req, res) => {
  try {
    const sizes = await CompanySize.findAll();
    res.status(200).json(sizes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};