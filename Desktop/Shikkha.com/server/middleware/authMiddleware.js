import jwt from 'jsonwebtoken';

const JWT_SECRET = 'supersecretkey'; 

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // includes user.id
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;
