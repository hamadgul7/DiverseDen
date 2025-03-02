const mongoose = require('mongoose');

const branchProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Product title is required"]
    },
    branchCode: { type: String, required: true }, // Branch Code
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Reference to Product
    price: {
        type: Number,
        required: [true, "Product Price is required"]
    },

    category: {
        type: String,
        required: [true, "Product Category is required"]
    },
    // imagePath: {
    //     type: [String]
    // },
    variants: [{
        size: String,
        material: String,
        colors: [{
            color: String,
            quantity: Number // Quantity assigned to this branch
        }]
    }],
    totalBranchQuantity: Number // Total assigned quantity in this branch
});

const BranchProduct = mongoose.model("BranchProduct", branchProductSchema);
module.exports = BranchProduct;
