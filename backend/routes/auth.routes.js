const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken, optionalAuthenticate } = require('../middleware/auth.middleware');

router.post('/signup', authController.handleSignup);
router.post('/login', authController.handleLogin);
router.post('/setup', authController.handleSetup);
router.post('/register', optionalAuthenticate, authController.handleRegister);
router.post('/refresh', authController.handleRefresh);
router.get('/profile', verifyToken, authController.handleGetProfile);
router.get('/me', verifyToken, authController.handleGetProfile);
router.put('/profile', verifyToken, authController.handleUpdateProfile);
router.post('/reset-password', verifyToken, authController.handleResetPassword);
router.post('/logout', (req, res) => res.json({ success: true }));

module.exports = router;
