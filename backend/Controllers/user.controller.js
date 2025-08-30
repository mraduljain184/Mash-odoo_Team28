const { validationResult } = require('express-validator');
const User = require('../Models/user.js');
const Worker = require('../Models/worker');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmailVerificationEmail } = require('../Utils/emailService');

// Register user
exports.registerUser = async (req, res, next) => {
  // Custom error for name length
  const { email, name, password, role = 'user', phone } = req.body;
  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'Name should be more than 3 letters' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be greater than 6' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const lowerEmail = email.toLowerCase();
    const lowerName = name.toLowerCase();

    // Determine target collection
    const isWorker = role === 'worker';

    // Capacity check only for end users if you want to keep same
    if (!isWorker) {
      const totalUsers = await User.countDocuments();
      if (totalUsers >= 600) {
        return res.status(403).json({ success: false, message: 'Registration closed – user limit reached. Limit will be increased soon' });
      }
    }

    // Email unique across both collections
    const emailExistsInUser = await User.findOne({ email: lowerEmail });
    const emailExistsInWorker = await Worker.findOne({ email: lowerEmail });
    if (emailExistsInUser || emailExistsInWorker) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    // Generate 6 digit numeric verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    let account;
    if (isWorker) {
      account = new Worker({
        email: lowerEmail,
        name: lowerName,
        phone: phone || null,
        password: hashed,
        isVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    } else {
      account = new User({
        email: lowerEmail,
        name: lowerName,
        phone: phone || null,
        role: 'user',
        password: hashed,
        isVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    await account.save();

    // Send verification email
    await sendEmailVerificationEmail(account.email, verificationToken);

    res.json({ success: true, message: 'User registered. Verification token sent to email.', data: { name: account.name, email: account.email } });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    // Look in both collections
    let account = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!account) {
      account = await Worker.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });
    }

    if (!account) return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    account.isVerified = true;
    account.emailVerificationToken = null;
    account.emailVerificationExpires = null;
    await account.save();
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const lower = email.toLowerCase();
    // Look in both collections
    let account = await User.findOne({ email: lower });
    if (!account) account = await Worker.findOne({ email: lower });

    if (!account) return res.status(404).json({ success: false, message: 'User not found' });
    if (account.isVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    // Generate new token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    account.emailVerificationToken = verificationToken;
    account.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();
    await sendEmailVerificationEmail(account.email, verificationToken);
    res.json({ success: true, message: 'Verification token resent.' });
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  if (!req.user) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.user.role === 'worker') {
      const me = await Worker.findById(req.user.id).select('-password');
      return res.json({ success: true, data: me });
    }
    // default user
    const me = await User.findById(req.user.id).select('-password');
    return res.json({ success: true, data: me });
  } catch (err) {
    next(err);
  }
};