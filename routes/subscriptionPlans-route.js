const express = require('express');
const verifyToken  = require('../middleware/authMiddleware');
const subscriptionPlansController = require('../controller/subscriptionPlans-controller')
const router = express.Router();

router.get('/subscriptionPlans', verifyToken, subscriptionPlansController.viewPlans)
router.post('/addSubscriptionPlan', verifyToken, subscriptionPlansController.addPlan)


module.exports = router;