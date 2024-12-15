const express = require('express');
const router = express.Router();
const orderController = require('../controller/orders-controller');

router.post('/addOrderDetails', orderController.addOrderDetails);

module.exports = router;