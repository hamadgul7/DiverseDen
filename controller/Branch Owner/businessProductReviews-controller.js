const ProductReviews = require('../../model/productReviews-model')

async function  viewBusinessProductReview(req, res){
    const { businessId } = req.body; 
    try {
        if (!businessId) {
            return res.status(400).json({ message: "Invalid Business ID" });
        }

        const productReviews = await ProductReviews.find({ businessId })
            .populate({
                path: "productId",
                select: "title imagePath"
            });

        if (!productReviews || productReviews.length === 0) {
            return res.status(404).json({ message: "No Reviews Found!" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

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
                    images: Array.isArray(review.productId.imagePath)
                        ? review.productId.imagePath.map((img) => `${baseUrl}/${img}`)
                        : [],
                    reviews: []
                };
            }

            reviewsByProduct[productId].reviewCount += 1;
            reviewsByProduct[productId].totalRating += review.rating;
            reviewsByProduct[productId].reviews.push({
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

        res.status(200).json({
            products: Object.values(reviewsByProduct),
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