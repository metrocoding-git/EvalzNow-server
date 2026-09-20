const db = require('../models');
const Client = db.Client;
const Account = db.Account;
const Staff = db.Staff;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "username, password, and role are required" });
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


const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

exports.recoverAccount = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Email is required" });

    const account = await Account.findOne({ where: { username } });
    if (!account) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const RESET_TOKEN_MINUTES = 10;
    account.resetToken = resetToken;
    account.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);
    await account.save();

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/newPassword?token=${resetToken}`;

    // Name for the greeting: client (executive) first, then staff
    const person =
      (await Client.findOne({
        where: { emailAddress: account.username },
        attributes: ["firstName", "lastName"],
      })) ||
      (await Staff.findOne({
        where: { emailAddress: account.username },
        attributes: ["firstName", "lastName"],
      }));
    const fullName = person ? `${person.firstName} ${person.lastName}`.trim() : "Customer";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const text = `Dear ${fullName}:

Thank you for choosing EvalzNow – The Ultimate Assessment Solution for Industry and Education.

This email contains all of the information that you will need to access your account.

Please use the reset link below to change your password.

${resetLink}

Regards,

EvalzNow Team`;

    const html = `
      <p>Dear ${escapeHtml(fullName)}:</p>
      <p>Thank you for choosing EvalzNow – The Ultimate Assessment Solution for Industry and Education.</p>
      <p>This email contains all of the information that you will need to access your account.</p>
      <p>Please use the reset link below to change your password.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Regards,</p>
      <p>EvalzNow Team</p>
    `;

    await transporter.sendMail({
      from: `"EvalzNow" <${process.env.EMAIL_USER}>`,
      to: account.username,
      subject: "Password Recovery",
      text,
      html,
    });

    res.status(200).json({ message: "Recovery email sent successfully" });
  } catch (error) {
    console.error("Recovery error:", error);
    res.status(500).json({ message: "Error processing recovery", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // 1. Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Token, password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // 2. Find account with token
    const account = await Account.findOne({
      where: { resetToken: token },
    });

    if (!account) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // 3. Check expiry
    if (!account.resetTokenExpiry || new Date() > account.resetTokenExpiry) {
      return res.status(400).json({
        message: "Reset token has expired",
      });
    }

    // 4. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Update password + clear reset fields
    account.password = hashedPassword;
    account.resetToken = null;
    account.resetTokenExpiry = null;

    await account.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};