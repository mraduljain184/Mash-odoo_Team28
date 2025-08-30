const express = require('express');
const router = express.Router();
const workshopController = require('../Controllers/workshop.controller');
const auth = require('../Middlewares/auth.middleware');

// Public listing for end users
router.get('/', workshopController.list);

// Worker-owned routes (IMPORTANT: define before '/:id')
router.get('/me/own', auth, workshopController.myWorkshop);
router.post('/me', auth, workshopController.createMine);
router.patch('/me', auth, workshopController.updateMine);

// Public detail endpoint
router.get('/:id', workshopController.get);

module.exports = router;
