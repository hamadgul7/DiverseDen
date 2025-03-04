const mongoose = require('mongoose');


const colorSchema = new mongoose.Schema({
    color: { 
        type: String, 
    },

    quantity: { 
        type: Number, 
        required: [true, "Quantity is required"] 
    },
});

const variantSchema = new mongoose.Schema({
    colors: [colorSchema], 
    material: { 
        type: String 
    },

    size: { 
        type: String, 
    }, 
    
    variantTotal: { 
        type: Number, 
        required: true 
    },
});


const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Product title is required"]
        },

        description: {
            type: String,
            required: [true, "Product Description is require"]
        },

        imagePath: {
            type: [String]
        },

        price: {
            type: Number,
            required: [true, "Product Price is required"]
        },

        category: {
            type: String,
            required: [true, "Product Category is required"]
        },

        subCategory: {
            type: String,
            validate: {
                validator: function (value) {
                    if (this.category === "Clothing" || this.category === "Shoes") {
                        return value && value.trim().length > 0;
                    }
                    return true;
                },
                message: "SubCategory is only required for Clothing or Shoes category",
            },
        },

        productType: {
            type: String,
            require: [true, "Product Type is required"]
        },

        sku: {
            type: String,
            required: [true, "Product SKU is required"],
        },

        variants: [variantSchema],

        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
        },

        branch: {
            type: [String],
           
        },

        totalAssignedQuantity: { 
            type: Number, 
            default: 0 
        },

        totalQuantity: {
            type: Number
        }
    },
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;