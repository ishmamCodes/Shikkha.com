import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Try to fetch the full user from DB
    let user = null;
    try {
      user = await User.findById(decoded.id || decoded._id || decoded.userId).select("-password");
    } catch {
      // If DB lookup fails, fallback to decoded info
      user = { id: decoded.id || decoded._id || decoded.userId, role: decoded.role };
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[AuthMiddleware Error]", error);
    return res.status(401).json({ error: "Token is invalid or expired" });
  }
};

export const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || (allowedRoles.length && !allowedRoles.includes(req.user.role))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

export default authMiddleware;
