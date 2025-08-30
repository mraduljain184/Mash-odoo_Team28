const express = require('express');
const router = express.Router();
const adminCtrl = require('../Controllers/admin.controller');
const auth = require('../Middlewares/auth.middleware');

// Reuse user JWT validation; assume a distinct admin auth middleware if needed later
router.get('/service-requests', adminCtrl.listServiceRequests);
router.patch('/service-requests/:id/status', adminCtrl.updateServiceStatus);
router.get('/stats', adminCtrl.getStats);
router.get('/settings', adminCtrl.getSettings);
router.patch('/settings', adminCtrl.updateSettings);

module.exports = router;
