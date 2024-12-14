const express = require('express');
const branchController = require('../../controller/Branch Owner/branch-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

router.get('/getBranchById', verifyToken, branchController.getBranchbyId);
router.get('/allBranches', verifyToken, branchController.allBranches);
router.get('/viewBranches', verifyToken, branchController.viewBranches);
router.post('/createBranch', verifyToken, branchController.createBranch);
router.post('/updateBranch', verifyToken, branchController.updateBranch);
router.post('/deleteBranch', verifyToken, branchController.deleteBranch);


module.exports = router;