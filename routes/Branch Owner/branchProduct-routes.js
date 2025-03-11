const express = require('express');
const branchProductController = require('../../controller/Branch Owner/branchProduct-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

//token
router.get('/viewBranchProductsById', verifyToken, branchProductController.viewBranchProductsById);
router.get('/viewBranchProductsByBranchCodeWithPagination', branchProductController.viewBranchProductsByBranchCodeWithPagination)
router.get('/viewBranchProductsByBranchCode', branchProductController.viewBranchProductsByBranchCode);
router.post('/assignProductToBranch', verifyToken, branchProductController.assignProductToBranch);
router.get('/calculateVariantRemainings', verifyToken, branchProductController.calculateVariantRemainings);
router.get('/viewBranchProductsDetail', verifyToken, branchProductController.viewBranchProductsDetail)

module.exports = router;