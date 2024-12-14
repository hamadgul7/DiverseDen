const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
    {
        // planId: {
        //     type: String,
        //     required: [true, "Plan Id is required"]
        // },

        name: {
            type: String,
            required: [true, "Plan Name is required"]
        },

        features: {
            type: [String],
            required: [true, "Plan features are required"]
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
