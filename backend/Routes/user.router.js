const express = require('express');
const { body } = require('express-validator');
const userController = require('../Controllers/user.controller');
const auth = require('../Middlewares/auth.middleware');
const router = express.Router();

// Register user
router.post('/register', function(req, res, next) {
  body('email').isEmail()(req, res, function(err) {
    if (err) return next(err);
    body('name').notEmpty()(req, res, function(err) {
      if (err) return next(err);
      body('password').isLength({ min: 6 })(req, res, function(err) {
        if (err) return next(err);
        body('role').isIn(['user','worker'])(req, res, function(err) {
          if (err) return next(err);
          userController.registerUser(req, res, next);
        });
      });
    });
  });
});

// Verify email
router.post('/verify-email', function(req, res, next) {
  body('token').isLength({ min: 6, max: 6 }).isNumeric()(req, res, function(err) {
    if (err) return next(err);
    userController.verifyEmail(req, res, next);
  });
});

// Resend verification
router.post('/resend-verification', function(req, res, next) {
  body('email').isEmail().normalizeEmail()(req, res, function(err) {
    if (err) return next(err);
    userController.resendVerification(req, res, next);
  });
});

// Get my profile (user/worker)
router.get('/me', auth, userController.getMyProfile);

module.exports = router;