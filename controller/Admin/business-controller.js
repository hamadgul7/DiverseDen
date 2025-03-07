const { Business } = require('../../model/Branch Owner/business-model');
const Plan = require('../../model/subscriptionPlans-model')

const moment = require("moment");

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
    
        const formattedBusinesses = businesses.map((business) => ({
          _id: business._id,
          name: business.name,
          description: business.description,
          branches: business.branches,
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
        }));
    
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
          message: "Businesses and Plans Fetched Successfully",
        });
      } catch (error) {
        res.status(500).json({ message: "Error fetching data", error: error.message });
      }
}

module.exports = {
    getAllBusinesses: getAllBusinesses
};
