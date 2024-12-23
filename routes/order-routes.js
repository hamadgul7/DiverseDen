const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware')
const orderController = require('../controller/orders-controller');

router.post('/addOrderDetails', orderController.addOrderDetails);
router.get('/getOrders', verifyToken, orderController.getOrders);

module.exports = router;