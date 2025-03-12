const mongoose = require('mongoose');


const cartItemSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: [true, "UserID is required"] 
        },

        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: [true, "Product ID is required"]  
        },

        quantity: { 
            type: Number, 
            required: [true, "Quantity is required"], 
            min: [1, "Quantity must be at least 1"] 
        }, 
        
        selectedVariant: { 
            size: { type: String},
            color: { type: String},
            material: { type: String }
        },
    },
    { timestamps: true }
);


const Cart = mongoose.model('Cart', cartItemSchema);

module.exports = Cart;
