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

    const { id, role, email } = decoded; // <-- expect token to carry id + role
    let principal = null;

    if (role === "student") {
      principal = await Student.findById(id).select("-password");
    } else if (role === "educator") {
      principal = await Educator.findById(id).select("-password");
    } else if (role === "admin") {
      // No DB lookup for admin
      principal = { _id: id, email, fullName: "Admin", role: "admin" };
    }

    if (!principal) {
      return res.status(401).json({ error: "User not found" });
    }

    // Convert to plain object if mongoose doc
    req.user = principal.toObject ? principal.toObject() : principal;
    req.user.role = role;

    next();
  } catch (error) {
    console.error("[AuthMiddleware Error]", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Role-based guard
export const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};

export default authMiddleware;
