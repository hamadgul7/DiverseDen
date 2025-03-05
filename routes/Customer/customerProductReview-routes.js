const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware')
const customerProductReviewController = require("../../controller/Customer/customerProductReview-controller");

//pehle my token verify karna hai q ke wo tab e review dega jab login hoga
router.post('/addProductReview', customerProductReviewController.addProductReview);
router.get('/viewProductReviews', customerProductReviewController.viewProductReview)

module.exports = router;