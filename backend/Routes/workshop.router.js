const express = require('express');
const router = express.Router();
const workshopController = require('../Controllers/workshop.controller');

// Public listing for end users
router.get('/', workshopController.list);

module.exports = router;
