
const Plan = require('../model/subscriptionPlans-model');


async function viewPlans(req, res) {
    try{
        const plans = await Plan.find();
        if(plans.length === 0){
            return res.status(404).json({ message: "No Subscription Plans Found" });
        }

        res.status(200).json({
            allplans: plans,
            message: "All Plans are here."
        })
    }
    catch(error){
        res.status(400).json({
            message: error.message
        })
    }
}

module.exports = {
    viewPlans:viewPlans
}
