const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const businessSubscriptionController = require('../../controller/Branch Owner/businessSubscription-controller');


router.get('/viewSubscriptionPlan',  verifyToken, businessSubscriptionController.viewBusinessPlan);
router.post('/cancelSubscriptionPlan', verifyToken, businessSubscriptionController.cancelSubscriptionPlan)


module.exports = router;