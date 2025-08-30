const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../Models/user');

const { sendResetPasswordEmail } = require('../Utils/emailService');

// Token validation endpoint
exports.validateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin tokens
    if (decoded.role === 'admin') {
      return res.json({ success: true, data: { role: 'admin', username: decoded.username || 'admin' } });
    }

    // User / Worker tokens
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token user' });
    return res.json({ success: true, data: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.userLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const email = (req.body.email || '').toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email before logging in.' });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    console.log(`User logged in: ${user.email} (${user.name}) role=${user.role} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    res.json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin login via environment credentials
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return res.status(500).json({ success: false, message: 'Admin credentials not configured' });
    }
    if (username !== adminUser || password !== adminPass) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ role: 'admin', username: adminUser }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token, data: { role: 'admin', username: adminUser } });
  } catch (err) {
    next(err);
  }
};

// Forgot password - send reset token via email
exports.forgotPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const emailResult = await sendResetPasswordEmail(user.email, resetToken);
    
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }

    res.json({
      success: true,
      message: 'Password reset token has been sent to your email address. Please check your inbox.'
    });
  } catch (err) {
    next(err);
  }
};

// Simple in-memory rate limit for /reset-password
const resetPasswordAttempts = {};
const RESET_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RESET_MAX_ATTEMPTS = 5;

exports.resetPassword = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || '';
  const now = Date.now();
  if (!resetPasswordAttempts[ip]) {
    resetPasswordAttempts[ip] = [];
  }
  // Remove old attempts
  resetPasswordAttempts[ip] = resetPasswordAttempts[ip].filter(ts => now - ts < RESET_WINDOW_MS);
  if (resetPasswordAttempts[ip].length >= RESET_MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many reset attempts. Please try again later.' });
  }
  resetPasswordAttempts[ip].push(now);

  // Block spamming IP
  if (req.ip === '104.28.212.15' || req.headers['x-forwarded-for'] === '104.28.212.15') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });

  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    next(err);
  }
};