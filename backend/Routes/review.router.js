const express = require('express');
const { body } = require('express-validator');
const auth = require('../Middlewares/auth.middleware');
const reviewController = require('../Controllers/review.controller');
const router = express.Router();

// List reviews of a workshop
router.get('/workshops/:id', reviewController.listByWorkshop);

// Add/update a review (user only)
router.post('/',
  auth,
  body('workshopId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString().isLength({ max: 1000 }),
  reviewController.upsert
);

module.exports = router;
