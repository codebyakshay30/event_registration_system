const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. protect: checks that a valid JWT token is sent (Authentication)
exports.protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Please login first' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// 2. authorize: checks the role of the logged-in user (Authorization)
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Only ${roles.join('/')} can do this` });
  }
  next();
};
