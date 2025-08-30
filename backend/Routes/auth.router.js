const express = require('express');
const { body } = require('express-validator');
const authController = require('../Controllers/auth.controller');
const router = express.Router();

// Token validation
router.get('/validate', authController.validateToken);

// Admin login
router.post('/admin/login', function(req, res, next) {
  body('username').notEmpty()(req, res, function(err) {
    if (err) return next(err);
    body('password').notEmpty()(req, res, function(err) {
      if (err) return next(err);
      authController.adminLogin(req, res, next);
    });
  });
});

// User login (by email)
router.post('/user/login', function(req, res, next) {
  body('email').isEmail().normalizeEmail()(req, res, function(err) {
    if (err) return next(err);
    body('password').notEmpty()(req, res, function(err) {
      if (err) return next(err);
      // Call the correct controller function
      authController.userLogin(req, res, next);
    });
  });
});

// Forgot password - send reset token
router.post('/forgot-password', function(req, res, next) {
  body('email').isEmail().normalizeEmail()(req, res, function(err) {
    if (err) return next(err);
    authController.forgotPassword(req, res, next);
  });
});

// Reset password
router.post('/reset-password', function(req, res, next) {
  body('token').isLength({ min: 6, max: 6 }).isNumeric()(req, res, function(err) {
    if (err) return next(err);
    body('newPassword').isLength({ min: 6 })(req, res, function(err) {
      if (err) return next(err);
      body('confirmPassword').isLength({ min: 6 })(req, res, function(err) {
        if (err) return next(err);
        authController.resetPassword(req, res, next);
      });
    });
  });
});

module.exports = router;