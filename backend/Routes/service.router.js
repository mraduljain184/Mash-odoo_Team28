const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'tmp_uploads/' });
const auth = require('../Middlewares/auth.middleware');
const ctrl = require('../Controllers/service.controller');

// Create a new service request
router.post('/', auth, upload.single('image'), ctrl.create);

module.exports = router;
