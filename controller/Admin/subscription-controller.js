const User = require('../../model/auth-model');
const Plan = require('../../model/subscriptionPlans-model');


async function addPlan(req, res){
    const { name, features, price, noOfBranches } = req.body;

    try{
        const planExist = await Plan.findOne({name});
        if(planExist){
            return res.status(400).json({message: "Plan already exist"})
        }

        const plan = new Plan({
            name,
            features,
            price,
            noOfBranches
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

async function updatePlan(req, res){
    const { planId, name, features, price, noOfBranches } = req.body;

    try {
        const existingPlan = await Plan.findById(planId);
        if (!existingPlan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const nameConflict = await Plan.findOne({ name, _id: { $ne: planId } });
        if (nameConflict) {
            return res.status(400).json({ message: "Plan with this name already exists" });
        }

        const updatedPlan = await Plan.findByIdAndUpdate(
            planId,
            { name, features, price, noOfBranches },
            { new: true, runValidators: true } 
        );

        res.status(200).json({
            plan: updatedPlan,
            message: "Plan Updated Successfully"
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

async function deletePlan(req, res){
    const { planId } = req.body; 

    try {
        const existingPlan = await Plan.findById(planId);
        if (!existingPlan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        await Plan.findByIdAndDelete(planId);

        res.status(200).json({ message: "Plan deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addPlan: addPlan,
    updatePlan: updatePlan,
    deletePlan: deletePlan
}