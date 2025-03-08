const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Plan Name is required"]
        },

        features: {
            type: [String],
            required: [true, "Plan features are required"]
        },

        noOfBranches: {
            type: Number,
            required: [true, "Number of Branches is required"],
            min: [1, "Must allow at least one branch"]
        },

        price: {
            type: Number,
            required: [true, "Plan Price is required"],
            min: [0, "Price Must be a positive value"]
        },
    }, 
    {timestamps: true}
)

const Plan = mongoose.model("Plan", subscriptionPlanSchema);

module.exports = Plan;
