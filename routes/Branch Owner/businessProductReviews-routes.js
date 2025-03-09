const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const businessProductReviewController = require('../../controller/Branch Owner/businessProductReviews-controller');

// add token
router.get('/viewBusinessProductsReviews', businessProductReviewController.viewBusinessProductReview);
router.post('/deleteAllSpecificProductReview',verifyToken, businessProductReviewController.deleteAllSpecificProductReview);
router.post('/deleteSpecificCustomerReview', verifyToken, businessProductReviewController.deleteSpecificCustomerReview);

module.exports = router;