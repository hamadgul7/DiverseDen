const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const userController = require('../../controller/Admin/user-controller');

//token add karna hai sub ma
router.get('/getAllUsers', userController.getAllUsers);
router.post('/deleteUserById', userController.deleteUserById);

module.exports = router;