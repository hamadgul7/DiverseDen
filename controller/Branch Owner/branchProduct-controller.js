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

    // Fetch branch with products populated
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

    // ✅ Get assigned quantities & totalBranchQuantity from BranchProduct model
    const productIds = paginatedProducts.map(product => product._id);

    const branchProductData = await BranchProduct.find({
        branchCode: branch.branchCode,
        product: { $in: productIds }
    }).select("product variants totalBranchQuantity");

    // Convert branch product data into a map for easy lookup
    const branchProductMap = {};
    branchProductData.forEach(bp => {
        branchProductMap[bp.product.toString()] = {
            totalBranchQuantity: bp.totalBranchQuantity,
            variants: bp.variants // Includes variant-level data if needed
        };
    });

    // Process products and calculate remaining quantity per variant
    const allProducts = paginatedProducts.map((product) => {
        const totalQuantity = product.totalQuantity || 0;
        const assignedQuantity = product.totalAssignedQuantity || 0;

        return {
            ...product.toObject(),
            remainingQuantity: Math.max(totalQuantity - assignedQuantity, 0), // Ensure it's not negative
            imagePath: product.imagePath?.map((image) => `${baseUrl}/${image}`) || [],
            totalBranchQuantity: branchProductMap[product._id]?.totalBranchQuantity || 0, // ✅ Include totalBranchQuantity
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

    //last latest sara chalta hai bs total branch assigned quantity kelie update kar raha hu
    // const { branchId, pageNo, limit } = req.query;

    // try {
    //     const pageNumber = parseInt(pageNo);
    //     const pageLimit = parseInt(limit);

    //     if (pageNumber < 1 || pageLimit < 1) {
    //         return res.status(400).json({ message: "PageNo and PageLimit must be positive integers" });
    //     }

    //     const branch = await Branch.findById(branchId).populate("products");
    //     if (!branch) {
    //         return res.status(404).json({ message: "Branch not found" });
    //     }

    //     if (!branch.products || branch.products.length === 0) {
    //         return res.status(200).json({ message: "No products found for this branch" });
    //     }

    //     const startIndex = (pageNumber - 1) * pageLimit;
    //     const endIndex = startIndex + pageLimit;
    //     const paginatedProducts = branch.products.slice(startIndex, endIndex);

    //     const baseUrl = `${req.protocol}://${req.get("host")}`;

    //     // Get assigned quantities from BranchProduct model
    //     const productIds = paginatedProducts.map(product => product._id);

    //     const assignedQuantities = await BranchProduct.aggregate([
    //         { $match: { product: { $in: productIds } } }, // Match products
    //         { $unwind: "$variants" }, // Flatten variants array
    //         {
    //             $group: {
    //                 _id: {
    //                     productId: "$product",
    //                     variantId: "$variants._id"
    //                 },
    //                 totalAssignedQuantity: { $sum: "$variants.quantity" }
    //             }
    //         }
    //     ]);

    //     // Convert assigned quantities into an easily accessible map
    //     const assignedQuantityMap = {};
    //     assignedQuantities.forEach(({ _id, totalAssignedQuantity }) => {
    //         if (!assignedQuantityMap[_id.productId]) {
    //             assignedQuantityMap[_id.productId] = {};
    //         }
    //         assignedQuantityMap[_id.productId][_id.variantId] = totalAssignedQuantity;
    //     });

    //     // Process products and calculate remaining quantity per variant
    //     const allProducts = paginatedProducts.map((product) => {
    //         const totalQuantity = product.totalQuantity || 0; // Assuming `totalQuantity` exists in Product schema
    //         const assignedQuantity = product.totalAssignedQuantity || 0;

    //         return {
    //             ...product.toObject(),
    //             remainingQuantity: Math.max(totalQuantity - assignedQuantity, 0), // Ensure it's not negative
    //             imagePath: product.imagePath?.map((image) => `${baseUrl}/${image}`) || [],
    //             variants: product.variants.map(variant => ({
    //                 ...variant,
    //                 remainingQuantity: variant.variantTotal - (assignedQuantityMap[product._id]?.[variant._id] || 0)
    //             }))
    //         };
    //     });

    //     const totalProducts = branch.products.length;
    //     const totalPages = Math.ceil(totalProducts / pageLimit);
    //     let nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
    //     let previousPage = pageNumber > 1 ? pageNumber - 1 : null;
    //     console.log(allProducts)
    //     res.status(200).json({
    //         products: allProducts,
    //         meta: {
    //             totalItems: totalProducts,
    //             totalPages,
    //             currentPage: pageNumber,
    //             pageLimit,
    //             nextPage,
    //             previousPage,
    //         },
    //         message: "Products retrieved successfully",
    //     });
    // } catch (error) {
    //     res.status(400).json({ message: error.message });
    // }
}

async function viewBranchProductsDetail(req, res){
    const { branchCode, productId } = req.body;
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
        const { branchCode, product } = req.body;  // Extract product data
        const { assignedQuantities } = product;
        const productId = product.product.id;
    
        // Find product in inventory
        const productDoc = await Product.findById(productId);
        if (!productDoc) return res.status(404).json({ message: "Product not found" });
    
        // Convert assignedQuantities to match `variants` structure
        let newVariants = assignedQuantities.map((assigned) => ({
            material: assigned.material,
            size: assigned.size,
            variantIndex: assigned.variantIndex,
            colors: assigned.colors.map(color => ({
                color: color.color,
                quantity: color.assignedQuantity, // New assigned quantity
            })),
        }));
    
        // Calculate total newly assigned quantity
        let newTotalAssignedQuantity = newVariants.reduce((sum, variant) => {
            return sum + variant.colors.reduce((colorSum, color) => colorSum + color.quantity, 0);
        }, 0);
    
        // Check available stock
        const remainingQuantity = productDoc.totalQuantity - productDoc.totalAssignedQuantity;
        if (newTotalAssignedQuantity > remainingQuantity) {
            return res.status(400).json({ message: "Not enough stock available" });
        }
    
        // Find existing branch inventory record
        let branchProduct = await BranchProduct.findOne({ branchCode, product: productId });
    
        if (branchProduct) {
            // ✅ Merge new quantities with existing ones instead of overwriting
            newVariants.forEach(newVariant => {
                let existingVariant = branchProduct.variants.find(v =>
                    v.material === newVariant.material && v.size === newVariant.size
                );
    
                if (existingVariant) {
                    newVariant.colors.forEach(newColor => {
                        let existingColor = existingVariant.colors.find(c => c.color === newColor.color);
                        if (existingColor) {
                            existingColor.quantity += newColor.quantity; // ✅ Increment quantity
                        } else {
                            existingVariant.colors.push(newColor);
                        }
                    });
                } else {
                    branchProduct.variants.push(newVariant);
                }
            });
    
            // ✅ Update total assigned quantity correctly
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
    
        // ✅ Update `totalAssignedQuantity` correctly
        productDoc.totalAssignedQuantity += newTotalAssignedQuantity;
    
        // ✅ Add branch code to `productDoc.branch` if it's not already present
        if (!productDoc.branch.includes(branchCode)) {
            productDoc.branch.push(branchCode);
        }
    
        await productDoc.save();
    
        // Update the branch record
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
    
    
    //last latest chalne wala 
    // masala ya hai dobara assign pa remaning barha raha hai q ke wo totally assign quantity ko change kar raha hai nah ke porana ko is ke sath milae
    // try {
    //     const { branchCode, product } = req.body;  // Extract product data
    //     const { assignedQuantities } = product;
    //     const productId = product.product.id;
    //     console.log(productId)
    //     // Find product in inventory
    //     const productDoc = await Product.findById(productId);
    //     if (!productDoc) return res.status(404).json({ message: "Product not found" });

    //     // Convert assignedQuantities to match `variants` structure
    //     let variants = assignedQuantities.map((assigned, index) => ({
    //         material: assigned.material,
    //         size: assigned.size,
    //         variantIndex: assigned.variantIndex,
    //         colors: assigned.colors.map(color => ({
    //             color: color.color,
    //             quantity: color.assignedQuantity,
    //         })),
    //     }));

    //     // Calculate total assigned quantity
    //     let totalAssignedQuantity = variants.reduce((sum, variant) => {
    //         return sum + variant.colors.reduce((colorSum, color) => colorSum + color.quantity, 0);
    //     }, 0);

    //     console.log("Total Assigned Quantity:", totalAssignedQuantity);

    //     // Check available stock
    //     const remainingQuantity = productDoc.totalQuantity - productDoc.totalAssignedQuantity;
    //     if (totalAssignedQuantity > remainingQuantity) {
    //         return res.status(400).json({ message: "Not enough stock available" });
    //     }

    //     // Update or create branch inventory record
    //     let branchProduct = await BranchProduct.findOne({ branchCode, product: productId });

    //     if (branchProduct) {
    //         branchProduct.variants = variants;
    //         branchProduct.totalBranchQuantity = totalAssignedQuantity;
    //         await branchProduct.save();
    //     } else {
    //         branchProduct = new BranchProduct({
    //             title: product.product.title,
    //             price: product.product.price,
    //             category: product.product.category,
    //             branchCode,
    //             product: productId,
    //             variants,
    //             totalBranchQuantity: totalAssignedQuantity,
    //         });
    //         await branchProduct.save();
    //     }

    //     // ✅ Update `totalAssignedQuantity`
    //     productDoc.totalAssignedQuantity += totalAssignedQuantity;
    //     await productDoc.save();

    //     // Update the branch record
    //     await Branch.findOneAndUpdate(
    //         { branchCode: branchCode },
    //         { $push: { products: productId } },
    //         { new: true }
    //     );

    //     res.status(200).json({ message: "Product assigned to branch successfully" });
    // } catch (error) {
    //     console.error("Error assigning product:", error);
    //     res.status(500).json({ message: "Internal Server Error" });
    // }

    //uppar wala b chalta hai last latest hai

    // porana wala chalta code
    // const { title, price, category, productType, productId, branchCode, variants, totalBranchQuantity } = req.body;
    // // const productData = req.body.product;
    // // console.log(productData)
    // // console.log("hello",productData.product.id)
    // // console.log(productData.assignedQuantities)

    // // Find product in inventory
    // const product = await Product.findById(productId);
    // if (!product) return res.status(404).json({ message: "Product not found" });

    // // Calculate total assigned quantity
    // let totalAssignedQuantity = variants.reduce((sum, variant) => {
    //     return sum + variant.colors.reduce((colorSum, color) => colorSum + color.quantity, 0);
    // }, 0);

    // console.log(totalAssignedQuantity)
    // // Check available stock
    // const remainingQuantity = product.totalQuantity - product.totalAssignedQuantity;
    // if (totalAssignedQuantity > remainingQuantity) {
    //     return res.status(400).json({ message: "Not enough stock available" });
    // }

    // // Update or create branch inventory record
    // let branchProduct = await BranchProduct.findOne({ branchCode, product: productId });
    // if (branchProduct) {
    //     branchProduct.variants = variants;
    //     branchProduct.totalBranchQuantity = totalAssignedQuantity;
    //     await branchProduct.save();
    // } else {
    //     branchProduct = new BranchProduct({
    //         title,
    //         price,
    //         category,
    //         productType,
    //         branchCode,
    //         product: productId,
    //         variants,
    //         totalBranchQuantity: totalAssignedQuantity,

    //     });
    //     await branchProduct.save();
    // }

    // // ✅ Update totalAssignedQuantity instead of totalQuantity
    // product.totalAssignedQuantity += totalAssignedQuantity;
    // await product.save();

    // const updateBranch = await Branch.findOneAndUpdate(
    //     { branchCode: branchCode },  // Find the branch with this branchCode
    //     { $push: { products: productId } },  // Push the new productId into the products array
    //     { new: true }  // Return the updated document
    // );
    

    // res.status(200).json({ message: "Product assigned to branch successfully" });
    
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
    
            // If colors array is not empty, calculate per color
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
                // Handle empty color case
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

    //porana chalta code 
    // try {
    //     const { productId } = req.query;
    //     console.log("Product ID:", productId);

    //     if (!mongoose.Types.ObjectId.isValid(productId)) {
    //         return res.status(400).json({ message: "Invalid product ID" });
    //     }

    //     const product = await Product.findById(productId);
    //     if (!product) {
    //         return res.status(404).json({ message: "Product not found" });
    //     }

    //     const assignedQuantities = await BranchProduct.aggregate([
    //         { $match: { product: new mongoose.Types.ObjectId(productId) } },
    //         { $unwind: "$variants" },
    //         { $unwind: { path: "$variants.colors", preserveNullAndEmptyArrays: true } },
    //         {
    //             $group: {
    //                 _id: {
    //                     size: "$variants.size",
    //                     material: "$variants.material",
    //                     color: "$variants.colors.color" || "No Colors Assigned"
    //                 },
    //                 assignedQuantity: { $sum: "$variants.colors.quantity" }
    //             }
    //         }
    //     ]);

    //     console.log("Assigned Quantities from Aggregation:", assignedQuantities);

    //     const assignedMap = new Map();
    //     assignedQuantities.forEach(({ _id, assignedQuantity }) => {
    //         const key = `${_id.size}-${_id.material}-${_id.color}`;
    //         assignedMap.set(key, assignedQuantity || 0);
    //     });

    //     console.log("Assigned Map:", assignedMap);

    //     const remainingVariants = product.variants.map((variant) => {
    //         let totalRemaining = variant.variantTotal;
    //         const remainingColors = variant.colors.length > 0
    //             ? variant.colors.map((color) => {
    //                 const key = `${variant.size}-${variant.material}-${color.color}`;
    //                 const assignedQuantity = assignedMap.get(key) || 0;
    //                 const remainingQuantity = color.quantity - assignedQuantity;
    //                 totalRemaining -= assignedQuantity;

    //                 return {
    //                     color: color.color,
    //                     assignedQuantity,
    //                     remainingQuantity: Math.max(remainingQuantity, 0)
    //                 };
    //             })
    //             : [{
    //                 color: "No Colors Assigned",
    //                 assignedQuantity: 0,
    //                 remainingQuantity: Math.max(totalRemaining, 0)
    //             }];

    //         return {
    //             size: variant.size,
    //             material: variant.material,
    //             colors: remainingColors,
    //             totalRemaining: Math.max(totalRemaining, 0)
    //         };
    //     });

    //     console.log("Remaining Variants:", remainingVariants);

    //     res.json({
    //         productId,
    //         productTitle: product.title,
    //         category: product.category,
    //         price: product.price,
    //         totalQuantity: product.totalQuantity,
    //         remainingVariants
    //     });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: "Internal Server Error", error: error.message });
    // }
    
}

module.exports = {
    viewBranchProductsById: viewBranchProductsById,
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