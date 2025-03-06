const mongoose = require('mongoose');
const moment = require('moment');

const saleEventSchema = new mongoose.Schema(
    {
        eventName: { 
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
            type: Number, 
            required: true, 
            min: 0 
        },

        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        ],

        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, "Business Id is required"]
        }
    },
    { timestamps: true }
);


const SaleEvent = mongoose.model("SaleEvent", saleEventSchema);
module.exports = SaleEvent;
