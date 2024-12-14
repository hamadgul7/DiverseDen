const express = require('express');
const router = express.Router();
const authController = require('../controller/auth-controller')

router.get('/verifyRefresh', authController.verifyTokenRefresh);
router.post('/register', authController.signup);
router.post('/login', authController.login);
// router.get('/allUsers', authController.getUser);

module.exports = router;