const mongoose = require('mongoose');
const moment = require('moment');

const saleEventSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true 
        },

        description: { 
            type: String 
        },

        startDate: { 
            type: Date,
            required: true
        },

        endDate: { 
            type: Date, 
            required: true
        },

        discountType: { 
            type: String, 
            required: true,
        },

        discountValue: { 
            type: String, 
            required: true, 
        },

        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                name: String,
                category: String,
                price: Number,
                discountedPrice: Number
            }
        ],

        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, "Business Id is required"]
        },

        imagePath: {
            type: String
        }
    },
    { timestamps: true }
);


const SaleEvent = mongoose.model("SaleEvent", saleEventSchema);
module.exports = SaleEvent;
