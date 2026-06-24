import jwt from 'jsonwebtoken';
import db from '../db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'automobile_distributor_jwt_secret_token_18273981273918273');
    
    // Retrieve user from the JSON database to ensure they still exist and are not blocked
    const user = await db.findOne('users', { id: decoded.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. Auth required.' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  next();
};
