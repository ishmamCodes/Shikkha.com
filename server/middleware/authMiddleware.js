import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Educator from "../models/Educator.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Resolve principal by role - each role has its own table
    const id = decoded.id || decoded._id || decoded.userId;
    const role = decoded.role;
    let principal = null;
    
    if (role === 'student') {
      principal = await Student.findById(id).select('-password');
    } else if (role === 'educator') {
      principal = await Educator.findById(id).select('-password');
    } else if (role === 'admin') {
      // Hardcoded admin - no database lookup needed
      principal = { _id: id, email: decoded.email, fullName: 'Admin', role: 'admin' };
    }

    if (!principal) {
      return res.status(401).json({ error: "User not found" });
    }

    // Convert mongoose document to plain object to retain enumerable fields like _id
    const userObj = (principal && typeof principal.toObject === 'function') ? principal.toObject() : principal;
    req.user = { ...userObj, id, role };
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
