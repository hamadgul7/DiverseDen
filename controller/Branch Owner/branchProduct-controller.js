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

        const productIds = paginatedProducts.map(product => product._id);

        const branchProductData = await BranchProduct.find({
            branchCode: branch.branchCode,
            product: { $in: productIds }
        }).select("product variants totalBranchQuantity");

        const branchProductMap = {};
        branchProductData.forEach(bp => {
            branchProductMap[bp.product.toString()] = {
                totalBranchQuantity: bp.totalBranchQuantity,
                variants: bp.variants 
            };
        });

        const allProducts = paginatedProducts.map((product) => {
            const totalQuantity = product.totalQuantity || 0;
            const assignedQuantity = product.totalAssignedQuantity || 0;

            return {
                ...product.toObject(),
                remainingQuantity: Math.max(totalQuantity - assignedQuantity, 0), 
                totalBranchQuantity: branchProductMap[product._id]?.totalBranchQuantity || 0, 
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

async function viewBranchProductsByBranchCodeWithPagination(req, res) {
    const { branchCode, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "PageNo and PageLimit must be positive integers" });
        }

        const branch = await Branch.findOne({branchCode}).populate("products");
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        if (!branch.products || branch.products.length === 0) {
            return res.status(200).json({ message: "No products found for this branch" });
        }

        const startIndex = (pageNumber - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;
        const paginatedProducts = branch.products.slice(startIndex, endIndex);

        const productIds = paginatedProducts.map(product => product._id);

        const branchProductData = await BranchProduct.find({
            branchCode: branch.branchCode,
            product: { $in: productIds }
        }).select("product variants totalBranchQuantity");

        const branchProductMap = {};
        branchProductData.forEach(bp => {
            branchProductMap[bp.product.toString()] = {
                totalBranchQuantity: bp.totalBranchQuantity,
                variants: bp.variants 
            };
        });

        const allProducts = paginatedProducts.map((product) => {
            const totalQuantity = product.totalQuantity || 0;
            const assignedQuantity = product.totalAssignedQuantity || 0;

            return {
                ...product.toObject(),
                remainingQuantity: Math.max(totalQuantity - assignedQuantity, 0), 
                totalBranchQuantity: branchProductMap[product._id]?.totalBranchQuantity || 0, 
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

async function viewBranchProductsByBranchCode(req, res) {
    try {
        const { branchCode } = req.query;
        const products = await BranchProduct.find({ branchCode })
            .populate({
                path: "product",
            })
            .lean();

        res.status(200).json({
            products,
            message: "Branch Products Retrieved Successfully"
        })

    } catch (error) {
        console.error("Error fetching branch products:", error);
        throw error;
    }
}

async function viewBranchProductsDetail(req, res){
    const { branchCode, productId } = req.query;
    try{
        if(!branchCode || !productId){
            return res.status(400).json({ message: "Invalid Branch Code or Product Id" })
        }

        const productDetails = await BranchProduct.findOne(
            {
                branchCode: branchCode,
                product: productId
            }
        ).populate('product')

        res.status(200).json({ 
            productDetails,
            message: "Branch Product Details Fetched Successfully"
        })

    } catch(error){
        res.status(400).json({ message: error.message })
    } 
}

async function assignProductToBranch(req, res){
    try {
        const { branchCode, product } = req.body;  
        const { assignedQuantities } = product;
        const productId = product.product.id;
    
        const productDoc = await Product.findById(productId);
        if (!productDoc) return res.status(404).json({ message: "Product not found" });
    
        let newVariants = assignedQuantities.map((assigned) => ({
            material: assigned.material,
            size: assigned.size,
            variantIndex: assigned.variantIndex,
            colors: assigned.colors.map(color => ({
                color: color.color,
                quantity: color.assignedQuantity, 
            })),
        }));
    
        let newTotalAssignedQuantity = newVariants.reduce((sum, variant) => {
            return sum + variant.colors.reduce((colorSum, color) => colorSum + color.quantity, 0);
        }, 0);
    
        const remainingQuantity = productDoc.totalQuantity - productDoc.totalAssignedQuantity;
        if (newTotalAssignedQuantity > remainingQuantity) {
            return res.status(400).json({ message: "Not enough stock available" });
        }
    
        let branchProduct = await BranchProduct.findOne({ branchCode, product: productId });
    
        if (branchProduct) {
            newVariants.forEach(newVariant => {
                let existingVariant = branchProduct.variants.find(v =>
                    v.material === newVariant.material && v.size === newVariant.size
                );
    
                if (existingVariant) {
                    newVariant.colors.forEach(newColor => {
                        let existingColor = existingVariant.colors.find(c => c.color === newColor.color);
                        if (existingColor) {
                            existingColor.quantity += newColor.quantity; 
                        } else {
                            existingVariant.colors.push(newColor);
                        }
                    });
                } else {
                    branchProduct.variants.push(newVariant);
                }
            });
    
            branchProduct.totalBranchQuantity += newTotalAssignedQuantity;
            await branchProduct.save();
        } else {
            branchProduct = new BranchProduct({
                title: product.product.title,
                price: product.product.price,
                category: product.product.category,
                branchCode,
                product: productId,
                variants: newVariants,
                totalBranchQuantity: newTotalAssignedQuantity,
            });
            await branchProduct.save();
        }
    
        productDoc.totalAssignedQuantity += newTotalAssignedQuantity;
    
        if (!productDoc.branch.includes(branchCode)) {
            productDoc.branch.push(branchCode);
        }
    
        await productDoc.save();
    
        await Branch.findOneAndUpdate(
            { branchCode: branchCode },
            { $addToSet: { products: productId } },
            { new: true }
        );
    
        res.status(200).json({ message: "Product assigned to branch successfully" });
    
    } catch (error) {
        console.error("Error assigning product:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
    
}

async function calculateVariantRemainings(req, res) {
    try {
        const { productId } = req.query;
        console.log("Product ID:", productId);
    
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
    
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
    
        const assignedQuantities = await BranchProduct.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId) } },
            { $unwind: "$variants" },
            { $unwind: { path: "$variants.colors", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: {
                        size: "$variants.size",
                        material: "$variants.material",
                        color: { $ifNull: ["$variants.colors.color", "No Colors Assigned"] }
                    },
                    assignedQuantity: { $sum: { $ifNull: ["$variants.colors.quantity", 0] } }
                }
            }
        ]);
    
        console.log("Assigned Quantities from Aggregation:", assignedQuantities);
    
        const assignedMap = new Map();
        assignedQuantities.forEach(({ _id, assignedQuantity }) => {
            const key = `${_id.size}-${_id.material}-${_id.color}`;
            assignedMap.set(key, assignedQuantity || 0);
        });
    
        console.log("Assigned Map:", assignedMap);
    
        const remainingVariants = product.variants.map((variant) => {
            let totalRemaining = variant.variantTotal;
    
            if (variant.colors.length > 0) {
                const remainingColors = variant.colors.map((color) => {
                    const key = `${variant.size}-${variant.material}-${color.color}`;
                    const assignedQuantity = assignedMap.get(key) || 0;
                    const remainingQuantity = color.quantity - assignedQuantity;
                    totalRemaining -= assignedQuantity;
    
                    return {
                        color: color.color,
                        assignedQuantity,
                        remainingQuantity: Math.max(remainingQuantity, 0)
                    };
                });
    
                return {
                    size: variant.size,
                    material: variant.material,
                    colors: remainingColors,
                    totalRemaining: Math.max(totalRemaining, 0)
                };
            } else {
                const key = `${variant.size}-${variant.material}-No Colors Assigned`;
                const assignedQuantity = assignedMap.get(key) || 0;
                totalRemaining -= assignedQuantity;
    
                return {
                    size: variant.size,
                    material: variant.material,
                    colors: [{
                        color: "No Colors Assigned",
                        assignedQuantity,
                        remainingQuantity: Math.max(totalRemaining, 0)
                    }],
                    totalRemaining: Math.max(totalRemaining, 0)
                };
            }
        });
    
        console.log("Remaining Variants:", remainingVariants);
    
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
    viewBranchProductsByBranchCodeWithPagination: viewBranchProductsByBranchCodeWithPagination,
    viewBranchProductsByBranchCode: viewBranchProductsByBranchCode,
    assignProductToBranch: assignProductToBranch,
    calculateVariantRemainings: calculateVariantRemainings,
    viewBranchProductsDetail: viewBranchProductsDetail
}













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