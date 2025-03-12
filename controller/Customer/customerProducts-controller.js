const Product = require('../../model/Branch Owner/products-model');
const SaleEvent = require('../../model/Branch Owner/saleEvent-model')

async function getCustomerProductbyId(req, res){
    
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

async function getProductsByCategory(req, res){
    const { category } = req.query;

    try {
        const products = await Product.find({ category }).populate({
            path: "business",
            select: "name", 
        });

        if (products.length === 0) {
            return res.status(200).json({ message: `No Products found for Category ${category}` });
        }

        const formatedProducts = products.map(product => ({
            ...product.toObject(), 
            business: product.business ? product.business._id : null,
            brand: product.business ? product.business.name : null, 
        }));

        res.status(200).json({
            products: formatedProducts,
            message: "Products Retrieved Successfully",
        });
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
    }

}

async function getProductsBySubcategoryAndType(req, res) {
    const { subCategory, productType } = req.query;

    try {
        const query = { productType };

        if (subCategory) {
            query.subCategory = subCategory;
        }

        const products = await Product.find(query).populate({
            path: "business",
            select: "name", 
        });

        if (products.length === 0) {
            return res.status(404).json({ message: "No Products Found" });
        }

        const formatedProducts = products.map(product => ({
            ...product.toObject(), 
            business: product.business ? product.business._id : null, 
            brand: product.business ? product.business.name : null, 
        }));

        res.status(200).json({
            products: formatedProducts,
            message: "Products Retrieved Successfully",
        });
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getSaleEventProducts(req, res){
    try {
        const { productId, eventId } = req.query;
    
        const product = await Product.findById(productId)
            .populate({ path: "business", select: "name" }) 
            .lean();
    
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
    
        const saleEvent = await SaleEvent.findById(eventId).lean();
    
        if (!saleEvent) {
            return res.status(404).json({ error: "Sale Event not found" });
        }
    
        const discountedProduct = saleEvent.products.find(
            (p) => p.productId.toString() === productId
        );
    
        const discountDetails = discountedProduct
            ? {
                  discountedPrice: discountedProduct.discountedPrice,
                  discountValue: saleEvent.discountValue,
              }
            : {
                  discountedPrice: null,
                  discountValue: null,
              };
    
        const productDetails = {
            ...product,
            business: product.business ? product.business._id : null, 
            brand: product.business ? product.business.name : null, 
            ...discountDetails,
        };
    
        res.status(200).json({
            productDetails,
            message: "Product retrieved successfully",
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(400).json({ error: error.message });
    }    
}

async function searchProduct(req, res){
    try {
        const { searchQuery } = req.query; 

        if (!searchQuery) {
            return res.status(400).json({ message: "Search query must not be empty" });
        }

        const regex = new RegExp(searchQuery, 'i');

      
        const products = await Product.aggregate([
            {
                $match: {
                    $or: [
                        { title: regex },
                        { category: regex },
                        { subCategory: regex },
                        { productType: regex }
                    ]
                }
            },
            {
                $addFields: {
                    exactMatch: {
                        $cond: [
                            { $eq: ["$title", searchQuery] },  
                            1,                                  
                            { $cond: [
                                { $eq: ["$category", searchQuery] }, 
                                1,                                 
                                { $cond: [
                                    { $eq: ["$subCategory", searchQuery] }, 
                                    1,                                      
                                    { $cond: [
                                        { $eq: ["$productType", searchQuery] }, 
                                        1,                                      
                                        0                                      
                                    ]}
                                ]}
                            ]}
                        ]
                    }
                }
            },
            { $sort: { exactMatch: -1 } } 
        ]);

        if(products.length === 0){
            return res.status(404).json({message: "No Related Products Found"})
        }

        res.status(200).json({
            products,
            message: "Searched Products"
        }); 
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = {
    getCustomerProductbyId: getCustomerProductbyId,
    getProductsByCategory: getProductsByCategory,
    getProductsBySubcategoryAndType: getProductsBySubcategoryAndType,
    getSaleEventProducts: getSaleEventProducts,
    searchProduct: searchProduct
   
}