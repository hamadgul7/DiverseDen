const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const orderController = require('../controller/orders-controller');

router.post('/addOrderDetails', orderController.addOrderDetails);
router.get('/getOrders', verifyToken, orderController.getOrders);
router.post('/updateOrderStatus', verifyToken, orderController.updateOrderStatus);
router.post('/deleteOrder', verifyToken, orderController.deleteOrder)

module.exports = router;