const mongoose = require('mongoose');
const moment = require("moment");

const productReviewSchema = mongoose.Schema(
    {   
        customerName: {
            type: String,
            required: [true, "Customer Name is required"]
        },

        rating:{
            type: Number,
            required: [true, "Rating is requied"]
        },

        comment: {
            type: String,
            required: [true, "Comment is required"]
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: [true, "User Id is required"]
        },

        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: [true, "Business Id is required"]
        },
        
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", 
            required: [true, "Product Id is required"]
        },      

        reviewDate: {
            type: String, 
            default: () => moment().format("MMMM Do, YYYY") 
        }        
    }
)

const ProductReviews = mongoose.model("ProductReviews", productReviewSchema);
module.exports = ProductReviews;