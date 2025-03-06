const express = require('express');
const saleEventController = require('../../controller/Branch Owner/saleEvent-controller');
const verifyToken = require('../../middleware/authMiddleware');
const router = express.Router();

//token add karna hai
router.post('/createSaleEvent', saleEventController.createSaleEvent);


module.exports = router;
