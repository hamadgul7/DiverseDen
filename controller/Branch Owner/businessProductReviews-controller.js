const ProductReviews = require('../../model/productReviews-model');
const mongoose = require('mongoose')

async function viewBusinessProductReview(req, res){

    try {
        const { businessId, pageNo, limit } = req.query;
        if (!businessId) {
            return res.status(400).json({ message: "Invalid Business ID" });
        }
    
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);
    
        if (isNaN(pageNumber) || isNaN(pageLimit) || pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "Invalid page number or limit" });
        }
    
        const skip = (pageNumber - 1) * pageLimit;
    
        const [productReviews, totalReviews] = await Promise.all([
            ProductReviews.find({ businessId })
                .populate({
                    path: "productId",
                    select: "title imagePath"
                })
                .skip(skip)
                .limit(pageLimit),
            ProductReviews.countDocuments({ businessId })
        ]);
    
        console.log(productReviews);
        
        if (!productReviews.length) {
            return res.status(200).json({
                products: [], 
                meta: {
                    totalReviews: 0,
                    totalPages: 0,
                    currentPage: pageNumber,
                    pageLimit,
                    nextPage: null,
                    previousPage: pageNumber > 1 ? pageNumber - 1 : null
                },
                message: "No Reviews Found!"
            });
        }
    
        const reviewsByProduct = {};
    
        productReviews.forEach((review) => {
            const productId = review.productId._id.toString();
    
            if (!reviewsByProduct[productId]) {
                reviewsByProduct[productId] = {
                    productId,
                    productName: review.productId.title,
                    reviewCount: 0,
                    totalRating: 0,
                    averageRating: 0,
                    images: Array.isArray(review.productId.imagePath) ? review.productId.imagePath : [],
                    reviews: []
                };
            }
    
            reviewsByProduct[productId].reviewCount += 1;
            reviewsByProduct[productId].totalRating += review.rating;
            reviewsByProduct[productId].reviews.push({
                _id: review._id, 
                customerName: review.customerName,
                rating: review.rating,
                comment: review.comment,
                reviewDate: review.reviewDate
            });
        });
    
        Object.values(reviewsByProduct).forEach((product) => {
            product.averageRating = (product.totalRating / product.reviewCount).toFixed(1);
            delete product.totalRating;
        });
    
        const totalPages = Math.ceil(totalReviews / pageLimit);
        const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        const previousPage = pageNumber > 1 ? pageNumber - 1 : null;
    
        res.status(200).json({
            products: Object.values(reviewsByProduct),
            meta: {
                totalReviews,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage
            },
            message: "Reviews Fetched Successfully"
        });
    
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
}

async function deleteAllSpecificProductReview(req, res){
    const { businessId, productId } = req.body;

    try {
        if (!businessId || !productId) {
            return res.status(400).json({ message: "Business ID and Product ID are required" });
        }

        const deleteResult = await ProductReviews.deleteMany({ businessId, productId });

        res.status(200).json({ 
            message: `Successfully deleted ${deleteResult.deletedCount} review(s) for this product in the business`
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteSpecificCustomerReview(req, res){
    const { reviewId } = req.body;

    try {
        if (!reviewId) {
            return res.status(400).json({ message: "Review ID is required" });
        }

        const deletedReview = await ProductReviews.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.status(200).json({ message: "Review deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    viewBusinessProductReview:  viewBusinessProductReview,
    deleteAllSpecificProductReview: deleteAllSpecificProductReview,
    deleteSpecificCustomerReview: deleteSpecificCustomerReview
}