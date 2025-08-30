const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const ctrl = require('../Controllers/service.controller');

// Create a new service request (client sends imageUrl after direct Cloudinary upload)
router.post('/', auth, ctrl.create);

// Get a single service by id (authorized users)
router.get('/:id', auth, ctrl.get);

module.exports = router;
