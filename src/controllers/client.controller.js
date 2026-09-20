const db = require('../models');
const Client = db.Client;
const Account = db.Account;
const CompanySize = db.CompanySize;
const { emailTaken, createLoginAccount, renameLoginAccount, deleteLoginAccounts } = require('../utils/accountSync');


// GET clients for the logged-in user's account
exports.getClients = async (req, res) => {
  try {

    const clients = await Client.findAll({
      
      include: [
        {
          model: Account, as: 'account', // filter by logged-in user's account
        },
        { model: CompanySize, as: 'companySize' }] // include company size
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
      lastName, firstName, jobTitle, emailAddress, companyName, companyContactNumber,
      institutionalType, businessRegistrationNo, country, companySizeId, status, accountId,
    } = req.body;

    if (await emailTaken(emailAddress)) {
      return res.status(400).json({ message: 'Email address already exists' });
    }

    const newClient = await db.sequelize.transaction(async (t) => {
      const client = await Client.create(
        {
          lastName, firstName, jobTitle, emailAddress, companyName, companyContactNumber,
          institutionalType, businessRegistrationNo, country, companySizeId, status, accountId,
        },
        { transaction: t }
      );
      await createLoginAccount(emailAddress, 'admin', t);   
      return client;
    });

    const clientWithSize = await Client.findOne({
      where: { id: newClient.id },
      include: [{ model: CompanySize, as: 'companySize' }],
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

    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const oldEmail = client.emailAddress;
    const newEmail = req.body.emailAddress;
    const emailChanged = newEmail && newEmail !== oldEmail;

    if (emailChanged && (await emailTaken(newEmail, { ignoreClientId: id }))) {
      return res.status(400).json({ message: 'Email address already exists' });
    }

    await db.sequelize.transaction(async (t) => {
      await client.update(req.body, { transaction: t });
      if (emailChanged) await renameLoginAccount(oldEmail, newEmail, t);   // account username follows email
    });

    const updatedClient = await Client.findOne({
      where: { id },
      include: [{ model: CompanySize, as: 'companySize' }],
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

    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const staff = await db.Staff.findAll({
      where: { clientId: id },
      attributes: ['emailAddress'],
    });

    await db.sequelize.transaction(async (t) => {
      await client.destroy({ transaction: t });
      await deleteLoginAccounts(
        [client.emailAddress, ...staff.map((s) => s.emailAddress)],
        { keepIds: [client.accountId, req.user?.id], transaction: t }
      );
    });

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};
