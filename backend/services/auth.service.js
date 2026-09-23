const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = db.prisma || db;

const generateTokens = (user) => {
  if (!process.env.JWT_SECRET) {
    throw { status: 500, message: 'Server authentication is not configured.' };
  }

  const accessToken = jwt.sign(
    { tokenType: 'access', id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
  );
  const refreshToken = jwt.sign(
    { id: user.id, tokenType: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

const publicUser = ({ passwordHash, resetTokenHash, resetExpiresAt, ...user }) => user;

const register = async ({ name, email, password }, requester = null) => {
  const userEmail = (email || '').trim().toLowerCase();
  if (!name?.trim() || !userEmail || !password || password.length < 8) {
    throw { status: 400, message: 'Name, email, and a password of at least 8 characters are required.' };
  }
  const userCount = await prisma.user.count();
  if (userCount > 0 && requester?.role !== 'ADMIN') {
    throw { status: 403, message: 'Account creation is restricted. Contact an administrator.' };
  }
  if (await prisma.user.findUnique({ where: { email: userEmail } })) {
    throw { status: 409, message: 'An account with this email already exists.' };
  }

  const user = await prisma.user.create({
    data: { name: name.trim(), email: userEmail, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' },
  });
  return { ...generateTokens(user), token: undefined, user: publicUser(user) };
};

// Public registration always creates a normal account, regardless of submitted role.
const signup = async ({ name, email, password }) => {
  const userName = typeof name === 'string' ? name.trim() : '';
  const userEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!userName || userName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) || userEmail.length > 254 || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw { status: 400, message: 'Enter your name, a valid email, and a password of at least 8 characters (maximum 72 bytes).' };
  }
  try {
    const user = await prisma.user.create({ data: {
      name: userName, email: userEmail, passwordHash: await bcrypt.hash(password, 12), role: 'STAFF',
    } });
    return { ...generateTokens(user), user: publicUser(user) };
  } catch (error) {
    if (error.code === 'P2002') throw { status: 409, message: 'An account with this email already exists. Please sign in.' };
    throw error;
  }
};

const loginUser = async (email, password) => {
  const userEmail = (email || '').trim().toLowerCase();
  const userPassword = (password || '').toString();
  if (!userEmail || !userPassword) {
    throw { status: 400, message: 'Email and password are required.' };
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user || !(await bcrypt.compare(userPassword, user.passwordHash))) {
    throw { status: 401, message: 'Invalid email or password.' };
  }

  return { ...generateTokens(user), token: undefined, user: publicUser(user) };
};

const resetUserPassword = async (userId, newPassword) => {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  return { message: 'Password updated successfully.' };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.tokenType !== 'refresh') throw { status: 401, message: 'Invalid refresh token.' };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw { status: 401, message: 'User not found.' };
    return generateTokens(user);
  } catch (error) {
    if (error.status) throw error;
    throw { status: 401, message: 'Invalid or expired refresh token.' };
  }
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw { status: 404, message: 'User not found.' };
  return user;
};

module.exports = { signup, register, login: loginUser, loginUser, resetUserPassword, refreshToken, getProfile };
