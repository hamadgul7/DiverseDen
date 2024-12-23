const path = require('path');
const Product = require('../../model/Branch Owner/products-model');
const { Business, Branch } = require('../../model/Branch Owner/business-model');

// function capitalizeFirstLetter(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

async function getProductbyId(req, res){
    const { productId } = req.query;
    try{
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({message: "No branch Found"})
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        if (Array.isArray(product.imagePath)) {
            product.imagePath = product.imagePath.map(image => `${baseUrl}/${image}`);
        } 


        res.status(200).json({
            product,
            message: "Product Retrieved Successfully"
        })
    } 
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function viewBusinessProductsbyId(req, res) {
    const { business, pageNo, limit } = req.query;
    
    try{
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if(pageNumber < 1 || pageLimit < 1){
            return res.status(400).json({ message: "Page Number and Limit must be positive numbers" })
        }

        const skip = (pageNumber - 1) * pageLimit;

        if(!business){
            return res.status(404).json({message: "BusinessId not available"})
        }

        const businessProducts = await Product.find({business: business}).skip(skip).limit(pageLimit);
        if(businessProducts.length === 0){
            return res.status(200).json({message: "No Products found!"})
        }
        const totalProducts = await Product.countDocuments({business: business});
        const totalPages = Math.ceil( totalProducts/ pageLimit );

        let nextPage = null
        if(pageNumber < totalPages){
            nextPage = pageNumber + 1;
        }

        let previousPage = null
        if(pageNumber > 1){
            previousPage = pageNumber - 1;
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const productsWithImages = businessProducts.map(product => {
            if (Array.isArray(product.imagePath)) {
                product.imagePath = product.imagePath.map(image => `${baseUrl}/${image}`);
            }
            return product;
        });

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
            message: "Products Retrived Successfully"
        })
    }
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function viewBranchProductsById(req, res) {
    const { branchId, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "PageNo and PageLimit must be positive integers" });
        }

        const branch = await Branch.findById(branchId).populate('products');
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        if (!branch.products || branch.products.length === 0) {
            return res.status(200).json({ message: "No products found for this branch" });
        }

        const startIndex = (pageNumber - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;
        const paginatedProducts = branch.products.slice(startIndex, endIndex);

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const productsWithImages = paginatedProducts.map((product) => {
            if (Array.isArray(product.imagePath)) {
                product.imagePath = product.imagePath.map((image) => `${baseUrl}/${image}`);
            }
            return product;
        });

        const totalProducts = branch.products.length;
        const totalPages = Math.ceil(totalProducts / pageLimit);
        let nextPage = null
        if(pageNumber < totalPages){
            nextPage = pageNumber + 1;
        }

        let previousPage = null
        if(pageNumber > 1){
            previousPage = pageNumber - 1;
        }

        res.status(200).json({
            products: productsWithImages,
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

async function addProduct(req, res) {
    const data = JSON.parse(req.body.data);
    const business = req.body.business;
    const files = req.files;
    if(!files){
        console.log("No image")
    }
    try{
        let filePaths = [];
        if (files && files.length > 0) {
            filePaths = files.map(file => path.join("uploads", file.filename));
        }

        const productData = {
            title: data.title,
            description: data.description,
            imagePath: filePaths,
            price: data.price,
            category: data.category,
            subCategory: data.subCategory,
            productType: data.productType,
            sku: data.sku,
            variants: data.variants,
            business,
            branch: data.branch,
            totalQuantity: data.totalQuantity
        }

        const skuExist = await Product.findOne({sku: data.sku});
        if(skuExist){
            if (skuExist.title !== data.title) {
                return res.status(400).json({
                    message: `A product with the same SKU already exists but has a different title: "${skuExist.title}". Please assign a unique SKU or ensure the titles match.`,
                });
            }
            return res.status(400).json({ message: "SKU Already Exist, assign unique sku" })
        }

        const businessExist = await Business.findById(business);
        if(!businessExist){
            return res.status(404).json({ message: "Business Not Found" });
        }

        const branchExist = await Branch.findOne(
            {
                branchCode: data.branch,
                business: business
            }
        )

        if(!branchExist){
            return res.status(404).json({message: "Branch Not Found!"})
        }


        const product = new Product(productData);
        const newProduct = await product.save();

        const assignProductToBranch = await Branch.findOneAndUpdate(
            {
                business: business,
                branchCode: data.branch
            },
            {
                $push: {products: newProduct._id}
            }
            
        )

        res.status(201).json({
            newProduct,
            message: "Product Added Successfully"
        });

    }
    catch(error){
        res.status(400).json({message: error.message})
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
            filePaths = files.map((file) => path.join("uploads", file.filename));
        }

        if (data.existingImages && Array.isArray(data.existingImages)) {
            const existingImagePaths = data.existingImages.map((image) => {
                if (image.startsWith("http://localhost:3000/")) {
                    return image.replace("http://localhost:3000/", "");
                }
                return image;
            });
            filePaths = [...existingImagePaths, ...filePaths];
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    title: data.title,
                    description: data.description,
                    imagePath: filePaths,
                    price: data.price,
                    category: data.category,
                    subCategory: data.subCategory,
                    productType: data.productType,
                    sku: data.sku,
                    variants: data.variants,
                },
            },
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

        res.status(200).json({message: "Product Deleted Successfully"})
    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function deleteProductFromBranch(req, res) {
    const { branchId, productId } = req.body;
    try{
        const deleteProductFromBranch = await Branch.findByIdAndUpdate(
            branchId,
            {
                $pull: {products: productId}
            }
        );

        res.status(200).json({message: "Product Deleted Successfully"})
    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    getProductbyId: getProductbyId,
    viewBusinessProductsbyId: viewBusinessProductsbyId,
    viewBranchProductsById: viewBranchProductsById,
    addProduct: addProduct,
    updateProductById: updateProductById,
    deleteProductById: deleteProductById,
    deleteProductFromBranch: deleteProductFromBranch
}

