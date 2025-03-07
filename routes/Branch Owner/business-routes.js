const express = require('express');
const businessController = require('../../controller/Branch Owner/business-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

router.post('/addBusiness', verifyToken, businessController.addBusiness);
router.get('/verifyBusiness', verifyToken, businessController.verifyBusiness);


module.exports = router;