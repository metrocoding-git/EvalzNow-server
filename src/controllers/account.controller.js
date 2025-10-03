const db = require('../models');
const Client = db.Client;
const Account = db.Account;
const Staff = db.Staff;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";


// POST login account
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔹 Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // 🔹 Check if account exists
    const account = await Account.findOne({ where: { username } });
    if (!account) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔹 Compare password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔹 Generate JWT
    const token = jwt.sign(
      {
        id: account.id,
        username: account.username,
        role: account.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 🔹 Determine clientId based on role
    let clientId = null;
    let staffId = null;
    if (account.role === "staff") {
      const staff = await Staff.findOne({
        where: { emailAddress: account.username }
      });
      clientId = staff ? staff.clientId : null;
      staffId = staff ? staff.id : null;
    } else if (account.role === "admin" || account.role === "super admin") {
      const client = await Client.findOne({
        where: { emailAddress: account.username }
      });
      clientId = client ? client.id : null;
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: account.id,
        username: account.username,
        role: account.role,
        acc: account.acc_id,
        clientId,
        staffId
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};


// POST create account
exports.createAccount = async (req, res) => {
    try {
      const { username, password, acc_id, role } = req.body;
  
      if (!username || !password || !acc_id || !role) {
        return res.status(400).json({ message: "username, password, acc_id, and role are required" });
      }
  
      // Check if username already exists
      const existing = await Account.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: "Username already exists" });
  
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create account
      const account = await Account.create({
        username,
        password,
        acc_id,
        role
      });
  
      // Optionally create associated client if clientData provided
    //   let client = null;
    //   if (clientData) {
    //     client = await Client.create({ ...clientData, accountId: account.id });
    //   }
  
      res.status(201).json({
        message: "Account created successfully",
        account,
      });
  
    } catch (error) {
      console.error("Create account error:", error);
      res.status(500).json({ message: "Error creating account", error: error.message });
    }
};



// GET current user
exports.getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // 🔹 Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔹 Find the account
    const account = await Account.findByPk(decoded.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    let responseData = {
      id: account.id,
      username: account.username,
      role: account.role,
      acc: account.acc_id,
    };

    // 🔹 If staff → include staffId + clientId
    if (account.role === "staff") {
      const staff = await Staff.findOne({
        where: { emailAddress: account.username }
      });
      responseData.staffId = staff ? staff.id : null;
      responseData.clientId = staff ? staff.clientId : null;
    } 
    // 🔹 If admin/super admin → include only clientId
    else if (account.role === "admin" || account.role === "super admin") {
      const client = await Client.findOne({
        where: { emailAddress: account.username }
      });
      responseData.clientId = client ? client.id : null;
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Error fetching current user", error: error.message });
  }
};
