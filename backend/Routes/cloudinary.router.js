const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const ctrl = require('../Controllers/cloudinary.controller');

// Return signed params for direct upload from client without exposing secrets
router.get('/signature', auth, ctrl.getUploadSignature);

module.exports = router;
