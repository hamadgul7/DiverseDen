
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

async function addPlan(req, res){
    const { name, features, price } = req.body;

    try{
        const planExist = await Plan.findOne({name});
        if(planExist){
            return res.status(400).json({message: "Plan already exist"})
        }

        const plan = new Plan({
            name,
            features,
            price
        });

        const planDetails = await plan.save();
        res.status(201).json({
            plan: planDetails,
            message: "Plan Added Successfully"
        });

    }
    catch(error){
        res.status(400).json({
            message: error.message
        })
    }
}

module.exports = {
    addPlan: addPlan,
    viewPlans:viewPlans
}
