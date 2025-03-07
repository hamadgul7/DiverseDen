const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const businessController = require('../../controller/Admin/business-controller');

//token add karna hai sub ma
router.get('/getAllBussinesses', businessController.getAllBusinesses);


module.exports = router;