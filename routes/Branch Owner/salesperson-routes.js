const express = require('express');
const salespersonController = require('../../controller/Branch Owner/salesperson-controller');
const verifyToken = require('../../middleware/authMiddleware');
const router = express.Router();

router.get('/viewSalesperson', verifyToken, salespersonController.viewSalesperson);
//verify token add karna hai
router.post('/addSalesperson', salespersonController.addSalesperson);
router.post('/deleteSalesperson', verifyToken, salespersonController.deleteSalesperson);


module.exports = router;
