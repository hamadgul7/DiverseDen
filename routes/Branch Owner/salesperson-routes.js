const express = require('express');
const salespersonController = require('../../controller/Branch Owner/salesperson-controller');
const verifyToken = require('../../middleware/authMiddleware');
const router = express.Router();

router.get('/viewSalesperson', verifyToken, salespersonController.viewSalesperson);
router.post('/addSalesperson', verifyToken, salespersonController.addSalesperson);
router.post('/deleteSalesperson', verifyToken, salespersonController.deleteSalesperson);


module.exports = router;
