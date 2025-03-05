const mongoose = require('mongoose');
const User = require('../../model/auth-model'); 
const Plan = require('../../model/subscriptionPlans-model');

async function viewBusinessPlan(req, res) {
    const { businessId } = req.body;
    try {
        const user = await User.findOne({ 
            business: businessId, 
            role: "Branch Owner" 
        })
        .populate("activePlan", "name price features")
        .select("firstname lastname email planActivation planExpiry activePlan");

        if (!user) {
            return { message: "No Branch Owner found for this business." };
        }

        return {
            ownerName: `${user.firstname} ${user.lastname}`,
            email: user.email,
            activePlan: user.activePlan ? user.activePlan.name : "No active plan",
            price: user.activePlan ? user.activePlan.price : "N/A",
            features: user.activePlan ? user.activePlan.features : [],
            planActivation: user.planActivation,
            planExpiry: user.planExpiry
        };
    } catch (error) {
        console.error("Error fetching active plan:", error);
        return { error: "Something went wrong while retrieving the active plan." };
    }
};

module.exports = {
    viewBusinessPlan: viewBusinessPlan
}

