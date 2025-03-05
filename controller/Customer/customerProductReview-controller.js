const { Branch, Business } = require('../../model/Branch Owner/business-model');
const Product = require('../../model/Branch Owner/products-model');
const User = require('../../model/auth-model');
const ProductReviews = require('../../model/productReviews-model');

async function addProductReview(req, res){
    const { userData, rating, comment, businessId, productId } = req.body;
    try{
        if(!userData || !rating || !comment || !businessId || !productId){
            return res.status(400).json({ message: "Invalid Data" })
        }

        const userExist = await User.findById(userData._id);
        if(!userExist){
            return res.status(404).json({ message: "User Not Found! First Signup please" })
        }

        const businessExist = await Business.findById(businessId);
        if(!businessExist){
            return res.status(404).json({ message: "Business Not Found" });
        }

        const productExist = await Product.findById(productId);
        if(!productExist){
            return res.status(404).json({ message: "Product Not Found" })
        }


        const reviewDetails = {
                customerName: `${userData.firstname} ${userData.lastname}`,
                rating: rating,
                comment: comment,
                userId: userData._id,
                businessId: businessId,
                productId: productId
            }

        const customerReview = new ProductReviews(reviewDetails);
        const savedReview = await customerReview.save();

        res.status(201).json({
            customerReview: savedReview,
            message: "Review Submitted Successfully"
        });


    }catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function viewProductReview(req, res){
    const { productId } = req.body;
    try {
        if (!productId) {
            return res.status(400).json({ message: "Invalid Product Id" });
        }

        const productReviews = await ProductReviews.find({ productId });

        if (!productReviews.length) { 
            return res.status(200).json({ message: "No Reviews Found!" });
        }

        const totalRatings = productReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRatings / productReviews.length;

        res.status(200).json({
            productReviews,
            averageRating: averageRating.toFixed(1),
            message: "Reviews Fetched Successfully"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    addProductReview: addProductReview,
    viewProductReview: viewProductReview
}