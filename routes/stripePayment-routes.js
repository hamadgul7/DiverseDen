const express = require('express');
const router = express.Router();
const stripeController = require('../controller/stripePayment-controller');
const verifyToken = require('../middleware/authMiddleware');


router.post('/planPayment', verifyToken, stripeController.planPayment);
router.post('/orderPayment', verifyToken, stripeController.orderPayment )


module.exports = router;