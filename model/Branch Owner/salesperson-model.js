const mongoose = require('mongoose');

const salespersonSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is Required"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            match: [
                /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                "Please enter a valid email",
            ],
            unique: false
        },
        assignBranch: {
            type: String,
            required: true
        },

        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        },
    },
    { timestamps: true }
)

const Salesperson = mongoose.model('Salesperson', salespersonSchema);
module.exports = Salesperson;