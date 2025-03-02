const path = require('path');
const mongoose = require('mongoose');
const Product = require('../../model/Branch Owner/products-model');
const { Business, Branch } = require('../../model/Branch Owner/business-model');
const BranchProduct = require('../../model/Branch Owner/branchProduct-model')

async function viewBranchProductsById(req, res) {
    
    const { branchId, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "PageNo and PageLimit must be positive integers" });
        }

        // Fetch branch with populated products
        const branch = await Branch.findById(branchId).populate("products");
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        if (!branch.products || branch.products.length === 0) {
            return res.status(200).json({ message: "No products found for this branch" });
        }

        const startIndex = (pageNumber - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;
        const paginatedProducts = branch.products.slice(startIndex, endIndex);

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        // Get assigned quantities from BranchProduct model
        const productIds = paginatedProducts.map(product => product._id);

        const assignedQuantities = await BranchProduct.aggregate([
            { $match: { product: { $in: productIds } } }, // Match products
            { $unwind: "$variants" }, // Flatten variants array
            {
                $group: {
                    _id: {
                        productId: "$product",
                        variantId: "$variants._id"
                    },
                    totalAssignedQuantity: { $sum: "$variants.quantity" }
                }
            }
        ]);

        // Convert assigned quantities into an easily accessible map
        const assignedQuantityMap = {};
        assignedQuantities.forEach(({ _id, totalAssignedQuantity }) => {
            if (!assignedQuantityMap[_id.productId]) {
                assignedQuantityMap[_id.productId] = {};
            }
            assignedQuantityMap[_id.productId][_id.variantId] = totalAssignedQuantity;
        });

        // Process products and calculate remaining quantity per variant
        const allProducts = paginatedProducts.map((product) => {
            const totalQuantity = product.totalQuantity || 0; // Assuming `totalQuantity` exists in Product schema
            const assignedQuantity = product.totalAssignedQuantity || 0;

            return {
                ...product.toObject(),
                remainingQuantity: Math.max(totalQuantity - assignedQuantity, 0), // Ensure it's not negative
                imagePath: product.imagePath?.map((image) => `${baseUrl}/${image}`) || [],
                variants: product.variants.map(variant => ({
                    ...variant,
                    remainingQuantity: variant.variantTotal - (assignedQuantityMap[product._id]?.[variant._id] || 0)
                }))
            };
        });

        const totalProducts = branch.products.length;
        const totalPages = Math.ceil(totalProducts / pageLimit);
        let nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        let previousPage = pageNumber > 1 ? pageNumber - 1 : null;

        res.status(200).json({
            products: allProducts,
            meta: {
                totalItems: totalProducts,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Products retrieved successfully",
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function assignProductToBranch(req, res){

    const { title, price, category, productType, productId, branchCode, variants, totalBranchQuantity } = req.body;
    console.log(productId)

    // Find product in inventory
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Calculate total assigned quantity
    let totalAssignedQuantity = variants.reduce((sum, variant) => {
        return sum + variant.colors.reduce((colorSum, color) => colorSum + color.quantity, 0);
    }, 0);

    console.log(totalAssignedQuantity)
    // Check available stock
    const remainingQuantity = product.totalQuantity - product.totalAssignedQuantity;
    if (totalAssignedQuantity > remainingQuantity) {
        return res.status(400).json({ message: "Not enough stock available" });
    }

    // Update or create branch inventory record
    let branchProduct = await BranchProduct.findOne({ branchCode, product: productId });
    if (branchProduct) {
        branchProduct.variants = variants;
        branchProduct.totalBranchQuantity = totalAssignedQuantity;
        await branchProduct.save();
    } else {
        branchProduct = new BranchProduct({
            title,
            price,
            category,
            productType,
            branchCode,
            product: productId,
            variants,
            totalBranchQuantity: totalAssignedQuantity,

        });
        await branchProduct.save();
    }

    // ✅ Update totalAssignedQuantity instead of totalQuantity
    product.totalAssignedQuantity += totalAssignedQuantity;
    await product.save();

    const updateBranch = await Branch.findOneAndUpdate(
        { branchCode: branchCode },  // Find the branch with this branchCode
        { $push: { products: productId } },  // Push the new productId into the products array
        { new: true }  // Return the updated document
    );
    

    res.status(200).json({ message: "Product assigned to branch successfully" });
    // const data = req.body;
    // // const business = req.body.business;
    // // const files = req.files;
    // // if(!files){
    // //     console.log("No image")
    // // }
    // try{
    //     // let filePaths = [];
    //     // if (files && files.length > 0) {
    //     //     filePaths = files.map(file => path.join("uploads", file.filename));
    //     // }

    //     const productData = {
            // title: data.title,
            // branch: data.branch,
            // product: data.product,
            // // imagePath: filePaths,
            // price: data.price,
            // category: data.category,
            // productType: data.productType,
            // variants: data.variants,
            // // business,
            // // branch: data.branch,
            // // branchQuantity: data.branchQuantity,
            // totalBranchQuantity: data.totalBranchQuantity
    //     }

    //     // const businessExist = await Business.findById(business);
    //     // if(!businessExist){
    //     //     return res.status(404).json({ message: "Business Not Found" });
    //     // }

    //     // const branchExist = await Branch.findOne(
    //     //     {
    //     //         branchCode: data.branch,
    //     //         business: business
    //     //     }
    //     // )

    //     // if(!branchExist){
    //     //     return res.status(404).json({message: "Branch Not Found!"})
    //     // }


    //     const product = new BranchProduct(productData);
    //     const newProduct = await product.save();

    //     // const assignProductToBranch = await Branch.findOneAndUpdate(
    //     //     {
    //     //         business: business,
    //     //         branchCode: data.branch
    //     //     },
    //     //     {
    //     //         $push: {products: newProduct._id}
    //     //     }
            
    //     // )

    //     res.status(201).json({
    //         newProduct,
    //         message: "Product Assigned Successfully"
    //     });

    // }
    // catch(error){
    //     res.status(400).json({message: error.message})
    // }
}

async function calculateVariantRemainings(req, res) {
    try {
        const { productId } = req.query;
        console.log("Product ID:", productId);

        // Validate productId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Aggregate assigned quantities for all variants in branches
        const assignedQuantities = await BranchProduct.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId) } },
            { $unwind: "$variants" }, // Flatten variants array
            { $unwind: "$variants.colors" }, // Flatten colors array within variants
            {
                $group: {
                    _id: {
                        size: "$variants.size",
                        material: "$variants.material",
                        color: "$variants.colors.color"
                    },
                    assignedQuantity: { $sum: "$variants.colors.quantity" }
                }
            }
        ]);

        console.log("Assigned Quantities from Aggregation:", assignedQuantities);

        // Convert aggregated result into a lookup object
        const assignedMap = new Map();
        assignedQuantities.forEach(({ _id, assignedQuantity }) => {
            const key = `${_id.size}-${_id.material}-${_id.color}`;
            assignedMap.set(key, assignedQuantity);
        });

        console.log("Assigned Map:", assignedMap);

        // Compute remaining quantities for each variant
        const remainingVariants = product.variants.map((variant) => {
            const remainingColors = variant.colors.map((color) => {
                const key = `${variant.size}-${variant.material}-${color.color}`;
                const assignedQuantity = assignedMap.get(key) || 0; // Default to 0 if no assigned quantity
                const remainingQuantity = color.quantity - assignedQuantity;

                return {
                    color: color.color,
                    remainingQuantity: Math.max(remainingQuantity, 0) // Ensure no negative values
                };
            });

            return {
                size: variant.size,
                material: variant.material,
                colors: remainingColors,
                totalRemaining: remainingColors.reduce((sum, c) => sum + c.remainingQuantity, 0)
            };
        });

        console.log("Remaining Variants:", remainingVariants);

        // Send response
        res.json({
            productId,
            productTitle: product.title,
            category: product.category,
            price: product.price,
            totalQuantity: product.totalQuantity,
            remainingVariants
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = {
    viewBranchProductsById: viewBranchProductsById,
    assignProductToBranch: assignProductToBranch,
    calculateVariantRemainings: calculateVariantRemainings
}