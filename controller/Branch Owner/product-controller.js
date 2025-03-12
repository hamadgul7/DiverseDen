const path = require('path');
const Product = require('../../model/Branch Owner/products-model');
const { Business, Branch } = require('../../model/Branch Owner/business-model');
const BranchProduct = require('../../model/Branch Owner/branchProduct-model');
const cloudinary = require('cloudinary').v2;
const ProductReviews = require('../../model/productReviews-model')

cloudinary.config({ 
    cloud_name: 'dxeumdgez', 
    api_key: '245894938873442', 
    api_secret: 'Io6lfY0VSf49RTbdmq6ZyLeGtxI'
});

// function capitalizeFirstLetter(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

async function getProductbyId(req, res){
    const { productId } = req.query;
    try {
        const product = await Product.findById(productId).populate({
            path: "business",
            select: "name", 
        });

        if (!product) {
            return res.status(404).json({ message: "No Product Found" });
        }

        res.status(200).json({
            product: {
                ...product.toObject(), 
                business: product.business ? product.business._id : null, 
            },
            brand: product.business ? product.business.name : null, 
            message: "Product Retrieved Successfully",
        });
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function viewBusinessProductsbyId(req, res) {
    const { business, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * pageLimit;

        if (!business) {
            return res.status(404).json({ message: "BusinessId not available" });
        }

        const businessProducts = await Product.find({ business }).skip(skip).limit(pageLimit);

        if (businessProducts.length === 0) {
            return res.status(200).json({ message: "No Products found!" });
        }

        const totalProducts = await Product.countDocuments({ business });
        const totalPages = Math.ceil(totalProducts / pageLimit);

        let nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        let previousPage = pageNumber > 1 ? pageNumber - 1 : null;

        const productsWithImages = businessProducts.map(product => ({
            ...product.toObject(),
            imagePath: Array.isArray(product.imagePath) ? product.imagePath : [],
            remainingQuantity: product.totalQuantity - (product.totalAssignedQuantity || 0),
            variants: product.variants.map(variant => ({
                ...variant,
                remainingQuantity: variant.variantTotal - (variant.assignedQuantity || 0)
            }))
        }));

        res.status(200).json({
            businessProducts: productsWithImages,
            meta: {
                totalItems: totalProducts,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Products Retrieved Successfully"
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function viewBusinessProductsbyIdWithoutPagination(req, res) {
    const { business } = req.query;

    try {
        if (!business) {
            return res.status(404).json({ message: "BusinessId not available" });
        }

        const businessProducts = await Product.find({ business });

        if (businessProducts.length === 0) {
            return res.status(200).json({ message: "No Products found!" });
        }

        const productsWithImages = businessProducts.map(product => ({
            ...product.toObject(),
            imagePath: Array.isArray(product.imagePath) ? product.imagePath : [],
            remainingQuantity: product.totalQuantity - (product.totalAssignedQuantity || 0),
            variants: product.variants.map(variant => ({
                ...variant,
                remainingQuantity: variant.variantTotal - (variant.assignedQuantity || 0)
            }))
        }));

        res.status(200).json({
            businessProducts: productsWithImages,
            message: "Products Retrieved Successfully"
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

}

async function addProduct(req, res) {
    try {
        const data = JSON.parse(req.body.data);
        const business = req.body.business;
        const files = req.files; 
        
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        console.log("Received product data:", data);

        let imagePaths = await Promise.all(
            files.map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path);
                return result.url;
            })
        );

        const productData = {
            title: data.title,
            description: data.description,
            imagePath: imagePaths, 
            price: data.price,
            category: data.category,
            subCategory: data.subCategory,
            productType: data.productType,
            sku: data.sku,
            variants: data.variants,
            business,
            totalQuantity: data.totalQuantity
        };

        const skuExist = await Product.findOne({ sku: data.sku });
        if (skuExist && skuExist.title !== data.title) {
            return res.status(400).json({
                message: `A product with the same SKU already exists but has a different title: "${skuExist.title}". Please assign a unique SKU or ensure the titles match.`,
            });
        }

        const businessExist = await Business.findById(business);
        if (!businessExist) {
            return res.status(404).json({ message: "Business Not Found" });
        }

        const product = new Product(productData);
        const newProduct = await product.save();

        res.status(201).json({
            newProduct,
            message: "Product added successfully"
        });

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Error adding product", error: error.message });
    }
}

async function updateProductById(req, res) {
    const { productId } = req.query;
    const data = JSON.parse(req.body.data);
    const files = req.files;
    
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }

        let filePaths = [];

        if (files && files.length > 0) {
            const uploadPromises = files.map(file => 
                cloudinary.uploader.upload(file.path)
            );
            
            const uploadResults = await Promise.all(uploadPromises);
            filePaths = uploadResults.map(result => result.secure_url);
        }

        if (data.existingImages && Array.isArray(data.existingImages)) {
            filePaths = [...data.existingImages, ...filePaths];
        }

        let totalNewQuantity;
        if (data.branchQuantity > product.branchQuantity) {
            const changedBranchQuantity = data.branchQuantity - product.branchQuantity;
            totalNewQuantity = changedBranchQuantity + data.totalQuantity;
        } else if (data.branchQuantity < product.branchQuantity) {
            const changedBranchQuantity = product.branchQuantity - data.branchQuantity;
            totalNewQuantity = data.totalQuantity - changedBranchQuantity;
        } else {
            totalNewQuantity = data.totalQuantity;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    title: data.title,
                    description: data.description,
                    branch: data.branch,
                    imagePath: filePaths,
                    price: data.price,
                    category: data.category,
                    subCategory: data.subCategory,
                    productType: data.productType,
                    sku: data.sku,
                    branchQuantity: data.branchQuantity,
                    totalQuantity: totalNewQuantity,
                    variants: data.variants,
                },
            },
            { new: true }
        );

        await Branch.findOneAndUpdate(
            { branchCode: data.branch },
            { $addToSet: { products: productId } },
            { new: true }
        );

        res.status(200).json({
            updatedProduct,
            message: "Product updated successfully",
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function deleteProductById(req, res){
    const { productId } = req.body;
    try{
        const product = await Product.findByIdAndDelete(productId);
        if(!product){
            return res.status(404).json({message: "Product Not found for deletion"})
        }

        const deleteProductFromBranch = await Branch.findByIdAndUpdate(
            productId,
            {
                $pull: {products: productId}
            }
        );
        await ProductReviews.deleteMany({ productId });

        res.status(200).json({message: "Product and related reviews deleted successfully"})
    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function deleteProductFromBranch(req, res) {
    const { branchId, productId } = req.body;

    try {
        const branch = await Branch.findById(branchId);
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        if (!branch.products.includes(productId)) {
            return res.status(400).json({ message: "Product is not assigned to this branch" });
        }

        await Branch.findByIdAndUpdate(
            branchId,
            { $pull: { products: productId } },
            { new: true }
        );

        const branchProduct = await BranchProduct.findOne({ branchCode: branch.branchCode, product: productId });

        if (branchProduct) {
            const totalBranchQuantity = branchProduct.totalBranchQuantity;

            await Product.findByIdAndUpdate(
                productId,
                {
                    $inc: { totalAssignedQuantity: -totalBranchQuantity }, 
                    $pull: { branch: branch.branchCode } 
                },
                { new: true }
            );

            await BranchProduct.findByIdAndDelete(branchProduct._id);
        }

        res.status(200).json({ message: "Product removed from branch successfully" });

    } catch (error) {
        console.error("Error removing product from branch:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    getProductbyId: getProductbyId,
    viewBusinessProductsbyId: viewBusinessProductsbyId,
    addProduct: addProduct,
    updateProductById: updateProductById,
    deleteProductById: deleteProductById,
    deleteProductFromBranch: deleteProductFromBranch,
    viewBusinessProductsbyIdWithoutPagination: viewBusinessProductsbyIdWithoutPagination
}














// const path = require('path');
// const Product = require('../../model/Branch Owner/products-model');
// const { Business, Branch } = require('../../model/Branch Owner/business-model');
// const BranchProduct = require('../../model/Branch Owner/branchProduct-model');
// const cloudinary = require('cloudinary').v2;

// cloudinary.config({ 
//     cloud_name: 'dxeumdgez', 
//     api_key: '245894938873442', 
//     api_secret: 'Io6lfY0VSf49RTbdmq6ZyLeGtxI'
// });

// // function capitalizeFirstLetter(string) {
// //     return string.charAt(0).toUpperCase() + string.slice(1);
// // }

// async function getProductbyId(req, res){
//     const { productId } = req.query;
//     try{
//         const product = await Product.findById(productId);
//         if(!product){
//             return res.status(404).json({message: "No branch Found"})
//         }

//         // const baseUrl = `${req.protocol}://${req.get('host')}`;

//         // if (Array.isArray(product.imagePath)) {
//         //     product.imagePath = product.imagePath.map(image => `${baseUrl}/${image}`);
//         // } 


//         res.status(200).json({
//             product,
//             message: "Product Retrieved Successfully"
//         })
//     } 
//     catch(error){
//         res.status(400).json({message: error.message})
//     }
// }

// async function viewBusinessProductsbyId(req, res) {
//     const { business, pageNo, limit } = req.query;
    
//     try {
//         const pageNumber = parseInt(pageNo);
//         const pageLimit = parseInt(limit);

//         if (pageNumber < 1 || pageLimit < 1) {
//             return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
//         }

//         const skip = (pageNumber - 1) * pageLimit;

//         if (!business) {
//             return res.status(404).json({ message: "BusinessId not available" });
//         }

        
//         const businessProducts = await Product.find({ business }).skip(skip).limit(pageLimit);

//         if (businessProducts.length === 0) {
//             return res.status(200).json({ message: "No Products found!" });
//         }

//         const totalProducts = await Product.countDocuments({ business });
//         const totalPages = Math.ceil(totalProducts / pageLimit);

//         let nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
//         let previousPage = pageNumber > 1 ? pageNumber - 1 : null;

//         const baseUrl = `${req.protocol}://${req.get("host")}`;

//         const productsWithImages = businessProducts.map(product => {
//             if (Array.isArray(product.imagePath)) {
//                 product.imagePath = product.imagePath.map(image => `${baseUrl}/${image}`);
//             }

//             return {
//                 ...product.toObject(),
//                 remainingQuantity: product.totalQuantity - (product.totalAssignedQuantity || 0),
//                 variants: product.variants.map(variant => ({
//                     ...variant,
//                     remainingQuantity: variant.variantTotal - (variant.assignedQuantity || 0) 
//                 }))
//             };
//         });

//         res.status(200).json({
//             businessProducts: productsWithImages,
//             meta: {
//                 totalItems: totalProducts,
//                 totalPages,
//                 currentPage: pageNumber,
//                 pageLimit,
//                 nextPage,
//                 previousPage,
//             },
//             message: "Products Retrieved Successfully"
//         });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// }

// async function viewBusinessProductsbyIdWithoutPagination(req, res) {
//     const { business } = req.query;
    
//     try {
//         if (!business) {
//             return res.status(404).json({ message: "BusinessId not available" });
//         }

//         const businessProducts = await Product.find({ business });

//         if (businessProducts.length === 0) {
//             return res.status(200).json({ message: "No Products found!" });
//         }

//         const baseUrl = `${req.protocol}://${req.get("host")}`;

//         const productsWithImages = businessProducts.map(product => {
//             if (Array.isArray(product.imagePath)) {
//                 product.imagePath = product.imagePath.map(image => `${baseUrl}/${image}`);
//             }

//             return {
//                 ...product.toObject(),
//                 remainingQuantity: product.totalQuantity - (product.totalAssignedQuantity || 0),
//                 variants: product.variants.map(variant => ({
//                     ...variant,
//                     remainingQuantity: variant.variantTotal - (variant.assignedQuantity || 0) 
//                 }))
//             };
//         });

//         res.status(200).json({
//             businessProducts: productsWithImages,
//             message: "Products Retrieved Successfully"
//         });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// }

// async function addProduct(req, res) {
//     try {
//         const data = JSON.parse(req.body.data);
//         const business = req.body.business;
//         const files = req.files; 
        
//         if (!files || files.length === 0) {
//             return res.status(400).json({ message: "At least one image is required" });
//         }

//         console.log("Received product data:", data);

//         let imagePaths = await Promise.all(
//             files.map(async (file) => {
//                 const result = await cloudinary.uploader.upload(file.path);
//                 return result.url;
//             })
//         );

//         const productData = {
//             title: data.title,
//             description: data.description,
//             imagePath: imagePaths, 
//             price: data.price,
//             category: data.category,
//             subCategory: data.subCategory,
//             productType: data.productType,
//             sku: data.sku,
//             variants: data.variants,
//             business,
//             totalQuantity: data.totalQuantity
//         };

//         const skuExist = await Product.findOne({ sku: data.sku });
//         if (skuExist && skuExist.title !== data.title) {
//             return res.status(400).json({
//                 message: `A product with the same SKU already exists but has a different title: "${skuExist.title}". Please assign a unique SKU or ensure the titles match.`,
//             });
//         }

//         const businessExist = await Business.findById(business);
//         if (!businessExist) {
//             return res.status(404).json({ message: "Business Not Found" });
//         }

//         const product = new Product(productData);
//         const newProduct = await product.save();

//         res.status(201).json({
//             newProduct,
//             message: "Product added successfully"
//         });

//     } catch (error) {
//         console.error("Error adding product:", error);
//         res.status(500).json({ message: "Error adding product", error: error.message });
//     }
// }

// async function updateProductById(req, res) {
//     const { productId } = req.query;
//     const data = JSON.parse(req.body.data);
//     const files = req.files;
//     try {
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: "Product not found!" });
//         }

//         let filePaths = [];

//         if (files && files.length > 0) {
//             filePaths = files.map((file) => path.join("uploads", file.filename));
//         }

//         if (data.existingImages && Array.isArray(data.existingImages)) {
//             const existingImagePaths = data.existingImages.map((image) => {
//                 if (image.startsWith("http://localhost:3000/")) {
//                     return image.replace("http://localhost:3000/", "");
//                 }
//                 return image;
//             });
//             filePaths = [...existingImagePaths, ...filePaths];
//         }

//         let totalNewQuantity;
//         if(data.branchQuantity > product.branchQuantity){
//             const changedBranchQuantity = data.branchQuantity - product.branchQuantity;
//             totalNewQuantity = changedBranchQuantity + data.totalQuantity;
//         }
//         else if (data.branchQuantity < product.branchQuantity){
//             const changedBranchQuantity = product.branchQuantity - data.branchQuantity;
//             totalNewQuantity = data.totalQuantity - changedBranchQuantity;
//         }
//         else {
//             totalNewQuantity = data.totalQuantity
//         }
        

//         const updatedProduct = await Product.findByIdAndUpdate(
//             productId,
//             {
//                 $set: {
//                     title: data.title,
//                     description: data.description,
//                     branch: data.branch,
//                     imagePath: filePaths,
//                     price: data.price,
//                     category: data.category,
//                     subCategory: data.subCategory,
//                     productType: data.productType,
//                     sku: data.sku,
//                     branchQuantity: data.branchQuantity,
//                     totalQuantity: totalNewQuantity,
//                     variants: data.variants,
//                 },
//             },
//             { new: true } 
//         );

//         const addProductInBranch = await Branch.findOneAndUpdate(
//             { branchCode: data.branch },
//             { $addToSet: { products: productId } }, 
//             { new: true }
//         );


//         res.status(200).json({
//             updatedProduct,
//             message: "Product updated successfully",
//         });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// }

// async function deleteProductById(req, res){
//     const { productId } = req.body;
//     try{
//         const product = await Product.findByIdAndDelete(productId);
//         if(!product){
//             return res.status(404).json({message: "Product Not found for deletion"})
//         }

//         const deleteProductFromBranch = await Branch.findByIdAndUpdate(
//             productId,
//             {
//                 $pull: {products: productId}
//             }
//         );

//         res.status(200).json({message: "Product Deleted Successfully"})
//     }
//     catch(error){
//         res.status(400).json({ message: error.message })
//     }
// }

// async function deleteProductFromBranch(req, res) {
//     const { branchId, productId } = req.body;

//     try {
//         // Check if branch exists
//         const branch = await Branch.findById(branchId);
//         if (!branch) {
//             return res.status(404).json({ message: "Branch not found" });
//         }

//         // Check if product exists in the branch
//         if (!branch.products.includes(productId)) {
//             return res.status(400).json({ message: "Product is not assigned to this branch" });
//         }

//         // Remove product from branch
//         await Branch.findByIdAndUpdate(
//             branchId,
//             { $pull: { products: productId } },
//             { new: true }
//         );

//         // Find BranchProduct associated with the branch and product
//         const branchProduct = await BranchProduct.findOne({ branchCode: branch.branchCode, product: productId });

//         if (branchProduct) {
//             // Get total assigned quantity in this branch
//             const totalBranchQuantity = branchProduct.totalBranchQuantity;

//             // Update Product model:
//             await Product.findByIdAndUpdate(
//                 productId,
//                 {
//                     $inc: { totalAssignedQuantity: -totalBranchQuantity }, // Subtract assigned quantity
//                     $pull: { branch: branch.branchCode } // Remove branchCode from Product model
//                 },
//                 { new: true }
//             );

//             // Delete the BranchProduct entry
//             await BranchProduct.findByIdAndDelete(branchProduct._id);
//         }

//         res.status(200).json({ message: "Product removed from branch successfully" });

//     } catch (error) {
//         console.error("Error removing product from branch:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

// module.exports = {
//     getProductbyId: getProductbyId,
//     viewBusinessProductsbyId: viewBusinessProductsbyId,
//     addProduct: addProduct,
//     updateProductById: updateProductById,
//     deleteProductById: deleteProductById,
//     deleteProductFromBranch: deleteProductFromBranch,
//     viewBusinessProductsbyIdWithoutPagination: viewBusinessProductsbyIdWithoutPagination
// }

