
const Plan = require('../model/subscriptionPlans-model');
const User = require('../model/auth-model')


async function viewPlans(req, res) {
    try {
        // Fetch all subscription plans
        const plans = await Plan.find();

        if (plans.length === 0) {
            return res.status(404).json({ message: "No Subscription Plans Found" });
        }

        // Fetch users grouped by their active subscription plans
        const usersByPlan = await User.aggregate([
            {
                $match: {
                    role: "Branch Owner",
                    activePlan: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "plans",
                    localField: "activePlan",
                    foreignField: "_id",
                    as: "planDetails"
                }
            },
            { $unwind: "$planDetails" },
            {
                $group: {
                    _id: "$planDetails.name",
                    users: {
                        $push: {
                            _id: "$_id",
                            firstname: "$firstname",
                            lastname: "$lastname",
                            email: "$email",
                            phone: "$phone",
                            role: "$role",
                            activePlan: "$activePlan",
                            planActivation: "$planActivation",
                            planExpiry: "$planExpiry",
                            business: "$business",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    plan: "$_id",
                    count: 1,
                    users: 1
                }
            }
        ]);

        // Create a mapping of plan names to their subscriber count
        const planCounts = usersByPlan.reduce((acc, item) => {
            acc[item.plan] = item.count;
            return acc;
        }, {});

        // Attach subscriber count to the plans list
        const enrichedPlans = plans.map(plan => ({
            ...plan.toObject(),
            subscriberCount: planCounts[plan.name] || 0
        }));

        return res.status(200).json({
            success: true,
            plans: enrichedPlans,
            usersByPlan,
            message: "Subscription plans with subscribers retrieved successfully."
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
}

module.exports = {
    viewPlans:viewPlans
}
