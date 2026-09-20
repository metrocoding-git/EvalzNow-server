const db = require('../models');
const Staff = db.Staff;
const Account = db.Account;
const Client = db.Client;
const { emailTaken, createLoginAccount, renameLoginAccount, deleteLoginAccounts } = require('../utils/accountSync');


// GET all Staff
exports.getStaff = async (req, res) => {
  try {
    const { clientId } = req.params;

    // ✅ Ensure client belongs to this account
    const client = await Client.findOne({
      where: { id: clientId },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found or not in your account" });
    }

    // ✅ Fetch staff for this client
    const staffs = await Staff.findAll({
      where: { clientId: clientId },
      include: [
        { model: Client, as: "client" }, // optional, returns client info
      ],
    });
    res.status(200).json(staffs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};


// GET staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.status(200).json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching staff', error: error.message });
  }
};

// CREATE new staff
exports.createStaff = async (req, res) => {
  try {
    const { emailAddress, clientId } = req.body;

    if (await emailTaken(emailAddress)) {
      return res.status(400).json({ message: 'Email address already exists' });
    }

    const client = await Client.findOne({ where: { id: clientId } });
    if (!client) {
      return res.status(400).json({ message: 'Invalid clientId for this account' });
    }

    const newStaff = await db.sequelize.transaction(async (t) => {
      const staff = await Staff.create({ ...req.body, clientId }, { transaction: t });
      await createLoginAccount(emailAddress, 'staff', t);  
      return staff;
    });

    res.status(201).json(newStaff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating staff', error: error.message });
  }
};

// UPDATE existing staff
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const oldEmail = staff.emailAddress;
    const newEmail = req.body.emailAddress;
    const emailChanged = newEmail && newEmail !== oldEmail;

    if (emailChanged && (await emailTaken(newEmail, { ignoreStaffId: staff.id }))) {
      return res.status(400).json({ message: 'Email address already exists' });
    }

    await db.sequelize.transaction(async (t) => {
      await staff.update(req.body, { transaction: t });
      if (emailChanged) await renameLoginAccount(oldEmail, newEmail, t);
    });

    res.status(200).json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating staff', error: error.message });
  }
};

// DELETE staff

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    await db.sequelize.transaction(async (t) => {
      await staff.destroy({ transaction: t });
      await deleteLoginAccounts([staff.emailAddress], {
        keepIds: [req.user?.id],
        transaction: t,
      });
    });

    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting staff', error: error.message });
  }
};