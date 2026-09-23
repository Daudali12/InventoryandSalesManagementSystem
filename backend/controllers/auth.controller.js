const authService = require('../services/auth.service');
const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');

const handleSignup = async (req, res, next) => {
  try { res.status(201).json({ success: true, ...await authService.signup(req.body) }); }
  catch (error) { next(error); }
};

const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const result = await authService.loginUser(email, password);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
};

const handleGetProfile = async (req, res, next) => {
  try { res.json({ success: true, user: await authService.getProfile(req.user.id) }); }
  catch (error) { next(error); }
};

const handleRegister = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req.user);
    res.status(201).json({ success: true, ...result });
  } catch (error) { next(error); }
};

const handleSetup = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) { next(error); }
};

const handleRefresh = async (req, res, next) => {
  try { res.json({ success: true, ...await authService.refreshToken(req.body.refreshToken) }); }
  catch (error) { next(error); }
};

const handleResetPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || typeof currentPassword !== 'string' || !await bcrypt.compare(currentPassword, user.passwordHash)) return res.status(400).json({ message: 'Current password is incorrect.' });
    res.json({ success: true, ...await authService.resetUserPassword(req.user.id, newPassword) });
  } catch (error) { next(error); }
};

const handleUpdateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return res.status(400).json({ message: 'Valid name and email required.' });
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name: name.trim(), email: email.trim().toLowerCase() }, select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

module.exports = { handleSignup, handleLogin, handleGetProfile, handleRegister, handleSetup, handleRefresh, handleResetPassword, handleUpdateProfile };
