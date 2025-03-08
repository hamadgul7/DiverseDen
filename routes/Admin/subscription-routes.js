const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const subscriptionController = require('../../controller/Admin/subscription-controller');

//token add karna hai sub ma
router.get('/getPlanSubscribers', subscriptionController.getPlanSubscribers)
router.post('/addSubscriptionPlan',  subscriptionController.addPlan);
router.post('/updatePlan', subscriptionController.updatePlan)


module.exports = router;