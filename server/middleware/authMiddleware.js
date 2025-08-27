// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Educator from "../models/Educator.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id, role, email } = decoded;

    let principal = null;
    if (role === "student") {
      principal = await Student.findById(id).select("-password");
    } else if (role === "educator") {
      principal = await Educator.findById(id).select("-password");
    } else if (role === "admin") {
      principal = { _id: id, email, fullName: "Admin", role: "admin" };
    }

    if (!principal) {
      return res.status(401).json({ error: "User not found" });
    }

    // Convert to POJO if needed
    req.user = principal.toObject ? principal.toObject() : principal;
    req.user.role = role;

    // 🔑 Ensure we ALWAYS have req.user.id (string)
    req.user.id = req.user.id || (req.user._id ? req.user._id.toString() : undefined);

    return next();
  } catch (error) {
    console.error("[AuthMiddleware Error]", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};

export default authMiddleware;
