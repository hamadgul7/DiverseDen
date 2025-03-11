const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: [true, "User Firstname is required"],
        },

        lastname: {
            type: String,
            required: [true, "User Lastname is required"],
        },
        
        email: {
            type: String,
            required: [true, "Email is required"],
            match: [
              /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
              "Please enter a valid email",
            ],
        },

        address: {
            type: String,
            required: [true, "Address is required"]
        },

        city: {
            type: String,
            // required: [true, "City is required"]
        },

        postal: {
            type: String
        },

        phone: {
            type: Number,
            required: [true, "Phone Number is required"]
        },

        paymentMethod: {
            type: String,
            required: [true, "Payment Method is required"]
        }
    },
)

const ordersSchema = new mongoose.Schema(
    {
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: [true, "BusinessId is require"]
        },

        branchCode: {
            type: String,
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "userId is require"]
        },

        userInfo: {
            type: userInfoSchema,
            required: [true, "UserInfo is required"]
        },

        cartItems: [{ type: mongoose.Schema.Types.Mixed }],

        status: {
            type: String,
            default: "Pending"
        },

        orderType: {
            type: String
        },
        
        subTotal: {
            type: Number,
            required: [true, "SubTotal is required"]
        },

        shippingCost: {
            type: Number,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: [true, "Total Amount is required"]
        },

    },
    {timestamps: true}
)

const Order = mongoose.model('Order', ordersSchema);

module.exports = Order;