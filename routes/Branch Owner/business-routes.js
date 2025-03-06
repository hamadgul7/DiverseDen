const express = require('express');
const businessController = require('../../controller/Branch Owner/business-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

router.post('/addBusiness', verifyToken, businessController.addBusiness);
//token add karna hai
router.get('/verifyBusiness', businessController.verifyBusiness);


module.exports = router;