const express = require('express');
const saleEventController = require('../../controller/Branch Owner/saleEvent-controller');
const verifyToken = require('../../middleware/authMiddleware');
const router = express.Router();

router.post('/createSaleEvent', verifyToken, saleEventController.createSaleEvent);
router.get('/viewSaleEvents', verifyToken, saleEventController.viewSaleEvents);
router.get('/viewSaleEventById', verifyToken, saleEventController.viewASaleEventById);
router.post('/updateSaleEvent', verifyToken, saleEventController.updateSaleEvent);
router.post('/deleteSaleEvent', verifyToken, saleEventController.deleteSaleEvent)

module.exports = router;
