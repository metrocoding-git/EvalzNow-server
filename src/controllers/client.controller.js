const db = require('../models');
const Client = db.Client;
const CompanySize = db.CompanySize;

// GET all clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      include: [{ model: CompanySize, as: 'companySize' }] // include company size
    });
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

// POST create a new client
exports.createClient = async (req, res) => {
  try {
    const {
      lastName,
      firstName,
      jobTitle,
      emailAddress,
      companyName,
      companyContactNumber,
      institutionalType,
      businessRegistrationNo,
      country,
      companySizeId,
      status
    } = req.body;

    const newClient = await Client.create({
      lastName,
      firstName,
      jobTitle,
      emailAddress,
      companyName,
      companyContactNumber,
      institutionalType,
      businessRegistrationNo,
      country,
      companySizeId,
      status
    });

    // Fetch created client including company size
    const clientWithSize = await Client.findOne({
      where: { id: newClient.id },
      include: [{ model: CompanySize, as: 'companySize' }]
    });

    res.status(201).json(clientWithSize);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};


// PUT update a client
exports.updateClient = async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Client.update(req.body, { where: { id } });
  
      if (updated[0] === 0) {
        return res.status(404).json({ message: 'Client not found or no changes made' });
      }
  
      const updatedClient = await Client.findOne({
        where: { id },
        include: [{ model: CompanySize, as: 'companySize' }]
      });
  
      res.status(200).json(updatedClient);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating client', error: error.message });
    }
  };
  
  // DELETE a client
  exports.deleteClient = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Client.destroy({ where: { id } });
  
      if (deleted === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting client', error: error.message });
    }
  };
