const mongoose = require('mongoose');
const User = require('../../model/auth-model'); 
const Plan = require('../../model/subscriptionPlans-model');

async function viewBusinessPlan(req, res) {
    const { businessId } = req.query; 

    try {
        if (!businessId) {
            return res.status(400).json({ error: "Business ID is required" });
        }

        const user = await User.findOne({ 
            business: businessId, 
            role: "Branch Owner" 
        })
        .populate("activePlan", "name price features") // Populate plan details
        .select("firstname lastname email planActivation planExpiry activePlan");

        if (!user) {
            return res.status(404).json({ message: "No Branch Owner found for this business." });
        }

        const planDetails = {
            ownerName: `${user.firstname} ${user.lastname}`,
            email: user.email,
            activePlan: user.activePlan 
                ? { 
                    planId: user.activePlan._id, 
                    name: user.activePlan.name,
                    price: user.activePlan.price,
                    features: user.activePlan.features
                  } 
                : { 
                    planId: null, 
                    name: "No active plan", 
                    price: "N/A", 
                    features: [] 
                  },
            planActivation: user.planActivation,
            planExpiry: user.planExpiry
        };

        res.status(200).json({
            planDetails,
            message: "Plan Data Fetched Successfully"
        });

    } catch (error) {
        console.error("Error fetching active plan:", error);
        res.status(500).json({ error: "Something went wrong while retrieving the active plan." });
    }
};

module.exports = {
    viewBusinessPlan: viewBusinessPlan
}

