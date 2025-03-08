const User = require('../../model/auth-model');
const Plan = require('../../model/subscriptionPlans-model');

async function getPlanSubscribers(req, res){
    try {
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
  
        const planCounts = usersByPlan.map(plan => ({
            plan: plan.plan,
            count: plan.count
        }));
    
        return res.status(200).json({
            success: true,
            usersByPlan,
            planCounts
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

module.exports = {
    getPlanSubscribers: getPlanSubscribers,
    addPlan: addPlan
}