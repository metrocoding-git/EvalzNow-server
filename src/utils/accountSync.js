const { Op } = require('sequelize');
const db = require('../models');
const { Account, Client, Staff } = db;

// true if the email is already used by another client, staff member or account
exports.emailTaken = async (email, { ignoreClientId, ignoreStaffId } = {}) => {
  const clientWhere = { emailAddress: email };
  if (ignoreClientId) clientWhere.id = { [Op.ne]: ignoreClientId };

  const staffWhere = { emailAddress: email };
  if (ignoreStaffId) staffWhere.id = { [Op.ne]: ignoreStaffId };

  const [c, s, a] = await Promise.all([
    Client.findOne({ where: clientWhere }),
    Staff.findOne({ where: staffWhere }),
    Account.findOne({ where: { username: email } }),
  ]);
  return Boolean(c || s || a);
};

// create the login account with an empty password
exports.createLoginAccount = (email, role, transaction) =>
  Account.create(
    {
      username: email,
      password: '',     
      role: role,  
    },
    { transaction }
  );

// change the account username after an email change.
// Creates the account if the record is old and has none.
exports.renameLoginAccount = async (oldEmail, newEmail, transaction) => {
  const [count] = await Account.update(
    { username: newEmail },
    { where: { username: oldEmail }, transaction }
  );
  if (count === 0) await exports.createLoginAccount(newEmail, transaction);
};

// delete login accounts by username (= email), never touching the protected ids
exports.deleteLoginAccounts = (emails, { keepIds = [], transaction } = {}) => {
  const list = emails.filter(Boolean);
  if (!list.length) return 0;

  const where = { username: { [Op.in]: list } };
  const keep = keepIds.filter(Boolean);
  if (keep.length) where.id = { [Op.notIn]: keep };

  return Account.destroy({ where, transaction });
};