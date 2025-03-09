const Product = require('../../model/Branch Owner/products-model');

async function getCustomerProductbyId(req, res){
    const { productId } = req.query;
    try{
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({message: "No branch Found"})
        }

        // const baseUrl = `${req.protocol}://${req.get('host')}`;

        // if (Array.isArray(product.imagePath)) {
        //     product.imagePath = product.imagePath.map(image => `${baseUrl}/${image}`);
        // } 


        res.status(200).json({
            product,
            message: "Product Retrieved Successfully"
        })
    } 
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function getProductsByCategory(req, res){
    const { category } = req.query;
    try{
        const products = await Product.find({
            category: category,
        });

        if(products.length === 0){
            return res.status(200).json({message: `No Products found for Category ${category}`})
        }

        // const baseUrl = `${req.protocol}://${req.get('host')}`;
        // const productsWithImages = products.map((product) =>{
        //     if(Array.isArray(product.imagePath)){
        //         product.imagePath = product.imagePath.map((image) => `${baseUrl}/${image}`);
        //     }
        //     return product;
        // });

        res.status(200).json({
            products,
            message: "Products Retrieved Successfully"
        });
    }
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function getProductsBySubcategoryAndType(req, res) {
    const { subCategory, productType } = req.query;
    try {
        const query = {
            productType: productType
        };

        if (subCategory) {
            query.subCategory = subCategory;
        }

        const products = await Product.find(query);

        if(products.length === 0){
            return res.status(404).json({message: 'No Products Found'})
        }
        
        // const baseUrl = `${req.protocol}://${req.get('host')}`;
        // const productsWithImages = products.map((product) => {
        //     if (Array.isArray(product.imagePath)) {
        //         product.imagePath = product.imagePath.map((image) => `${baseUrl}/${image}`);
        //     }
        //     return product;
        // });

        res.status(200).json({
            products,
            message: "Products Retrieved Successfully",
        });
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
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

        // const baseUrl = `${req.protocol}://${req.get('host')}`;
        // const productsWithImages = products.map((product) =>{
        //     if(Array.isArray(product.imagePath)){
        //         product.imagePath = product.imagePath.map((image) => `${baseUrl}/${image}`);
        //     }
        //     return product;
        // });

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
    searchProduct: searchProduct
}