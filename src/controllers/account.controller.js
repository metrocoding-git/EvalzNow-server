const db = require('../models');
const Client = db.Client;
const Account = db.Account;
const Staff = db.Staff;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { signToken, revokeToken, revokeAllForAccount, loadPrincipal } = require("../utils/authTokens");

// Used to keep login timing the same whether or not the username exists
// (prevents discovering valid usernames by measuring response time).
const DUMMY_HASH = bcrypt.hashSync("evalznow-dummy-password", 10);
const MIN_PASSWORD_LENGTH = 8;
const hashResetToken = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");


// POST login account
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔹 Validate input (strings only - blocks object/operator injection)
    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    if (username.length > 100 || password.length > 200) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔹 Check if account exists
    const account = await Account.findOne({ where: { username } });

    // 🔹 Compare password (always run bcrypt so timing does not reveal valid usernames)
    const storedHash = account && account.password ? account.password : DUMMY_HASH;
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, storedHash);
    } catch (_) {
      isMatch = false;
    }
    if (!account || !account.password || !isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔹 Disabled staff accounts cannot sign in
    const principal = await loadPrincipal(account.id);
    if (principal && principal.disabled) {
      return res.status(403).json({ message: "Account is disabled. Please contact your administrator." });
    }

    // 🔹 Generate JWT (short-lived, unique id so it can be revoked on logout)
    const token = signToken(account);

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


// POST logout - ends this session on the server (token can no longer be used)
exports.logout = async (req, res) => {
  try {
    await revokeToken(req.token);
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Error logging out" });
  }
};

// POST logout-all - ends every session of this account (all devices/browsers)
exports.logoutAll = async (req, res) => {
  try {
    await revokeAllForAccount(req.user.id);
    res.status(200).json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout-all error:", error);
    res.status(500).json({ message: "Error logging out" });
  }
};


// POST create account
exports.createAccount = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "username, password, and role are required" });
    }
    if (!["super admin", "admin", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    // Check if username already exists
    const existing = await Account.findOne({ where: { username } });
    if (existing) return res.status(400).json({ message: "Username already exists" });

    // Create account (the model hook hashes the password)
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

    // Never send the password hash back to the browser
    const { password: _pw, resetToken: _rt, resetTokenExpiry: _rte, ...safeAccount } = account.toJSON();
    res.status(201).json({
      message: "Account created successfully",
      account: safeAccount,
    });

  } catch (error) {
    res.status(500).json({ message: "Error creating account", error: error.message });
  }
};



// GET current user (token already verified by authenticateToken)
exports.getCurrentUser = async (req, res) => {
  try {
    const u = req.user;
    const responseData = { id: u.id, username: u.username, role: u.role };
    if (u.role === "staff") {
      responseData.staffId = u.staffId;
      responseData.clientId = u.clientId;
    } else if (u.role === "admin" || u.role === "super admin") {
      responseData.clientId = u.clientId;
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
    if (typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Same answer whether or not the email exists (prevents account discovery).
    const GENERIC_MSG = "If an account exists for this email, a recovery link has been sent.";

    const account = await Account.findOne({ where: { username: username.trim() } });
    if (!account) {
      return res.status(200).json({ message: GENERIC_MSG });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const RESET_TOKEN_MINUTES = 10;
    // Only a hash is stored: a database leak cannot be used to reset passwords.
    account.resetToken = hashResetToken(resetToken);
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

    // Sent in the background: the response time is the same whether or not the
    // account exists (no timing-based account discovery) and the user is not kept waiting.
    transporter.sendMail({
      from: `"EvalzNow" <${process.env.EMAIL_USER}>`,
      to: account.username,
      subject: "Password Recovery",
      text,
      html,
    }).catch((mailError) => console.error("Recovery email failed:", mailError.message));

    res.status(200).json({ message: GENERIC_MSG });
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

    if (typeof token !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    // 2. Find account with token (stored hashed)
    const account = await Account.findOne({
      where: { resetToken: hashResetToken(token) },
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

    // 6. Sign out every existing session for this account
    await revokeAllForAccount(account.id);

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