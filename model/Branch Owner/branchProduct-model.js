const mongoose = require('mongoose');

const branchProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Product title is required"]
    },

    branchCode: { type: String, required: true }, 

    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, 

    price: {
        type: Number,
        required: [true, "Product Price is required"]
    },

    category: {
        type: String,
        required: [true, "Product Category is required"]
    },

    variants: [{
        size: String,
        material: String,
        colors: [{
            color: String,
            quantity: Number 
        }]
    }],
    totalBranchQuantity: Number 
});

const BranchProduct = mongoose.model("BranchProduct", branchProductSchema);
module.exports = BranchProduct;
