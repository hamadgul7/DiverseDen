const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware')
const customerProductReviewController = require("../../controller/Customer/customerProductReview-controller");


router.post('/addProductReview', verifyToken, customerProductReviewController.addProductReview);
router.get('/viewProductReviews', customerProductReviewController.viewProductReview)

module.exports = router;