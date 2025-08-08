import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id || decoded._id || decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || (allowedRoles.length && !allowedRoles.includes(req.user.role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

export default authMiddleware;
