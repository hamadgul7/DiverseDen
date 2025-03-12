
const Plan = require('../model/subscriptionPlans-model');
const User = require('../model/auth-model')


async function viewPlans(req, res) {
    try {
        const plans = await Plan.find();

        if (plans.length === 0) {
            return res.status(404).json({ message: "No Subscription Plans Found" });
        }

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
                    _id: "$planDetails._id", 
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
            }
        ]);

        const userMap = usersByPlan.reduce((acc, item) => {
            acc[item._id] = {
                subscribers: item.users,
                subscriberCount: item.count
            };
            return acc;
        }, {});

        const enrichedPlans = plans.map(plan => ({
            ...plan.toObject(),
            subscribers: userMap[plan._id]?.subscribers || [], 
            subscriberCount: userMap[plan._id]?.subscriberCount || 0 
        }));

        return res.status(200).json({
            success: true,
            plans: enrichedPlans,
            message: "Subscription plans with subscriber details retrieved successfully."
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
