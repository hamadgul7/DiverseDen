const express = require('express');
const router = express.Router();
const planPaymentController = require('../controller/stripePayment-controller');
const verifyToken = require('../middleware/authMiddleware');


router.post('/planPayment', verifyToken, planPaymentController.planPayment);


module.exports = router;