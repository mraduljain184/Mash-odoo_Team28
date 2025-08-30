const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../Models/user');
const { sendResetPasswordEmail } = require('../Utils/emailService');
// Add new models
const Admin = require('../Models/admin');
const Worker = require('../Models/worker');

// Token validation endpoint
exports.validateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      const admin = await Admin.findOne({ username: decoded.username?.toLowerCase?.() || decoded.username });
      if (!admin) return res.status(401).json({ success: false, message: 'Invalid token admin' });
      return res.json({ success: true, data: { role: 'admin', username: admin.username } });
    }

    if (decoded.role === 'worker') {
      let worker = await Worker.findById(decoded.id);
      if (!worker) {
        // fallback to legacy worker stored in User collection
        const legacy = await User.findById(decoded.id);
        if (legacy && legacy.role === 'worker') {
          return res.json({ success: true, data: { id: legacy._id, name: legacy.name, role: 'worker', email: legacy.email } });
        }
        return res.status(401).json({ success: false, message: 'Invalid token user' });
      }
      return res.json({ success: true, data: { id: worker._id, name: worker.name, role: 'worker', email: worker.email } });
    }

    // Default to end user
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token user' });
    // if legacy token had worker but token says user, still return user.role for safety
    return res.json({ success: true, data: { id: user._id, name: user.name, role: user.role || 'user', email: user.email } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.userLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const email = (req.body.email || '').toLowerCase();

    let account = await Worker.findOne({ email });
    let role = 'worker';

    if (!account) {
      account = await User.findOne({ email });
      // respect role from legacy user collection
      role = account && account.role === 'worker' ? 'worker' : 'user';
    }

    if (!account) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    if (!account.isVerified) return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email before logging in.' });

    const isMatch = await bcrypt.compare(req.body.password, account.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: account._id, role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    console.log(`User logged in: ${account.email} (${account.name}) role=${role} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    res.json({
      success: true,
      token,
      data: {
        id: account._id,
        name: account.name,
        role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin login via MongoDB Admin collection
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const uname = (username || '').toLowerCase();

    const admin = await Admin.findOne({ username: uname, isActive: true });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const passOk = await bcrypt.compare(password || '', admin.password);
    if (!passOk) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ role: 'admin', username: admin.username }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token, data: { role: 'admin', username: admin.username } });
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
    const lower = (email || '').toLowerCase();

    // Look in both collections
    let account = await User.findOne({ email: lower });
    let collection = 'user';
    if (!account) {
      account = await Worker.findOne({ email: lower });
      collection = 'worker';
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetPasswordToken = resetToken;
    account.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await account.save();

    const emailResult = await sendResetPasswordEmail(account.email, resetToken);
    
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

    // Check both collections
    let account = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!account) {
      account = await Worker.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    }

    if (!account) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    account.password = hashedPassword;
    account.resetPasswordToken = null;
    account.resetPasswordExpires = null;

    await account.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    next(err);
  }
};