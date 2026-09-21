const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server authentication is not configured.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tokenType !== 'access') throw new Error('Invalid token type');
    const user = await require('../config/db').prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, name: true, email: true, role: true } });
    if (!user) throw new Error('Account missing');
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const optionalAuthenticate = async (req, res, next) => {
  if (!req.headers.authorization) return next();
  return verifyToken(req, res, next);
};

module.exports = { verifyToken, authenticate: verifyToken, optionalAuthenticate };
