const express = require('express');
const branchProductController = require('../../controller/Branch Owner/branchProduct-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

router.get('/viewBranchProductsById', verifyToken, branchProductController.viewBranchProductsById);
router.post('/assignProductToBranch', verifyToken, branchProductController.assignProductToBranch);

module.exports = router;