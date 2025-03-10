const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
    {
        branchCode: {
            type: String,
            required: [true, "Branch code is required"],
        },

        name: {
            type: String,
            required: [true, "Branch name is required"],
        },

        city: {
            type: String,
            required: [true, "City is required"],
        },

        address: {
            type: String,
            required: [true, "Address is required"],
        },

        contactNo: {
            type: String,
            required: [true, "Contact number is required"],
            match: [
              /^[0-9]{10,15}$/, 
              "Please enter a valid contact number",
            ],
        },

        emailAddress: {
            type: String,
            required: [true, "Email address is required"],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address",
            ],
            unique: false
        },

        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: [true, "Business ID is required"],
        },

        salesperson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Salesperson',
            default: null
        },

        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                default: null
            },
        ],

        isMainBranch: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);


const businessSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Brand name is required"],
        },

        description: {
            type: String,
        },

        branches: [
            {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch", 
            default: null
            },
        ],

        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        }, 

        accountHolderName: { 
            type: String, 
            required: [true, "Account holder name is required"] 
        },

        bankName: { 
            type: String, 
            required: [true, "Bank name is required"], 
        },

        accountNumber: { 
            type: String, 
            required: [true, "Account number is required"], 
            unique: false 
        },

    },
    { timestamps: true }
);

const Business = mongoose.model("Business", businessSchema);
const Branch = mongoose.model("Branch", branchSchema);

module.exports = { Business, Branch };