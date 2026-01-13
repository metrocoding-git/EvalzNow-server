const jwt = require("jsonwebtoken");
const db = require("../models");
const Account = db.Account;

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the account to request
    const account = await Account.findOne({ where: { id: decoded.id } });
    if (!account) return res.status(404).json({ message: "Account not found" });

    req.user = account; // store account in request object
    next();
  } catch (error) {
    console.error("JWT auth error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
