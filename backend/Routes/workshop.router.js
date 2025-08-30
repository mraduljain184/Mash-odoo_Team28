const express = require('express');
const router = express.Router();
const workshopController = require('../Controllers/workshop.controller');

// Public listing for end users
router.get('/', workshopController.list);

// Public detail endpoint
router.get('/:id', workshopController.get);

module.exports = router;
