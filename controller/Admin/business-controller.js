const { Business, Branch } = require('../../model/Branch Owner/business-model');
const Plan = require('../../model/subscriptionPlans-model');
const Product = require('../../model/Branch Owner/products-model');
const User = require('../../model/auth-model');
const Order = require('../../model/orders-model');
const Cart = require('../../model/Customer/cart-model');
const ProductReviews = require('../../model/productReviews-model');
const Salesperson = require('../../model/Branch Owner/salesperson-model');
const SaleEvent = require('../../model/Branch Owner/saleEvent-model');


async function getAllBusinesses(req, res) {
  try {
    const { pageNo, limit } = req.query;

    const pageNumber = parseInt(pageNo);
    const limitNumber = parseInt(limit);

    if (pageNumber < 1 || limitNumber < 1) {
      return res.status(400).json({ message: "Page number and limit must be positive numbers" });
    }

    const skip = (pageNumber - 1) * limitNumber;
    const totalBusinesses = await Business.countDocuments();

    const plans = await Plan.find().sort({ price: 1 });

    const businesses = await Business.find()
      .populate({
        path: "user",
        select: "firstname lastname email role planActivation planExpiry activePlan",
        populate: {
          path: "activePlan",
          select: "name features price",
        },
      })
      .populate({
        path: "branches",
        select: "name",
      })
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    if (!businesses.length) {
      return res.status(200).json({
        businesses: [],
        plans,
        meta: {
          totalBusinesses,
          totalPages: Math.ceil(totalBusinesses / limitNumber),
          currentPage: pageNumber,
          pageLimit: limitNumber,
          nextPage: null,
          previousPage: pageNumber > 1 ? pageNumber - 1 : null,
        },
        message: "No businesses found",
      });
    }

    const totalPages = Math.ceil(totalBusinesses / limitNumber);
    const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
    const previousPage = pageNumber > 1 ? pageNumber - 1 : null;

    const currentDate = new Date(); 

    const formattedBusinesses = businesses.map((business) => {
      let status = "inactive";

      if (business.user && business.user.planExpiry) {
        const planExpiryDate = new Date(business.user.planExpiry);
        console.log(planExpiryDate)
        console.log(currentDate)
        status = planExpiryDate >= currentDate ? "active" : "inactive";
      }

      return {
        _id: business._id,
        name: business.name,
        description: business.description,
        branches: business.branches.map(branch => branch.name),
        status,
        user: business.user
          ? {
              _id: business.user._id,
              firstname: business.user.firstname,
              lastname: business.user.lastname,
              email: business.user.email,
              role: business.user.role,
              planActivation: business.user.planActivation,
              planExpiry: business.user.planExpiry,
              activePlan: business.user.activePlan
                ? {
                    planId: business.user.activePlan._id,
                    name: business.user.activePlan.name,
                    features: business.user.activePlan.features,
                    price: business.user.activePlan.price,
                  }
                : null,
            }
          : null,
        accountHolderName: business.accountHolderName,
        bankName: business.bankName,
        accountNumber: business.accountNumber,
        createdAt: business.createdAt.toISOString().split("T")[0],
      };
    });

    res.status(200).json({
      businesses: formattedBusinesses,
      plans,
      meta: {
        totalBusinesses,
        totalPages,
        currentPage: pageNumber,
        pageLimit: limitNumber,
        nextPage,
        previousPage,
      },
      message: "Businesses Fetched Successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
}

async function deleteBusinessById(req, res){
  try {
    const { businessId } = req.body;
    const business = await Business.findByIdAndDelete(businessId);
    console.log("Business deleted successfully.");

    const products = await Product.deleteMany({ business: businessId });
    console.log("Products deleted successfully.");

    const branches = await Branch.deleteMany({ business: businessId });
    console.log("Branches deleted successfully.");

    const users = await User.findOneAndDelete({ business: businessId });
    console.log("User deleted successfully.");

    const orders = await Order.deleteMany({ businessId });
    console.log("Orders deleted successfully.");

    const cartItems = await Cart.deleteMany({ productId: { $in: await Product.find({ business: businessId }).distinct("_id") } });
    console.log("Cart items deleted successfully.");

    const reviews = await ProductReviews.deleteMany({ businessId });
    console.log("Product reviews deleted successfully.");

    const salesperson = await Salesperson.deleteMany({ business: businessId });
    console.log("Salespersons deleted successfully.");

    const saleEvent = await SaleEvent.deleteMany({ businessId });
    console.log("Sale events deleted successfully.");

    res.status(201).json({
      business,
      products,
      branches,
      users,
      orders,
      cartItems,
      reviews,
      salesperson,
      saleEvent, 
      message: "Business Deleted Successfully" 
    })
    
  }catch(error){
      res.status(500).json({
        message: error.message
      })
  }
}

module.exports = {
    getAllBusinesses: getAllBusinesses,
    deleteBusinessById: deleteBusinessById
};
