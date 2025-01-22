const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const { getAsync } = require('../config/cache');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  // Check for token in Authorization header or cookies
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const cachedToken = await getAsync(`auth_${userId}`);
    if (!cachedToken || cachedToken !== token) {
      return res.status(403).json({ status: 'fail', message: 'Invalid session or token revoked.' });
    }

    const user = await User.findById(userId).select('id role email name');
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(403).json({ status: 'fail', message: 'Invalid or expired token.' });
  }
};

module.exports = protect;
