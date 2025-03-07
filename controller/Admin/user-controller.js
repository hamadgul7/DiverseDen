const User = require('../../model/auth-model');
const moment = require('moment');

async function getAllUsers(req, res){
    try {
        const { pageNo, limit } = req.query;

        const pageNumber = parseInt(pageNo);
        const limitNumber = parseInt(limit);

        if (pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const totalUsers = await User.countDocuments();

        const users = await User.find()
            .populate("activePlan", "planName price duration") 
            .populate("business", "businessName address")
            .skip(skip)
            .limit(limitNumber);

        if (!users.length) {
            return res.status(200).json({
                users: [],
                meta: {
                    totalUsers,
                    totalPages: Math.ceil(totalUsers / limitNumber),
                    currentPage: pageNumber,
                    pageLimit: limitNumber,
                    nextPage: null,
                    previousPage: pageNumber > 1 ? pageNumber - 1 : null,
                },
                message: "No users found"
            });
        }

        const totalPages = Math.ceil(totalUsers / limitNumber);
        const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        const previousPage = pageNumber > 1 ? pageNumber - 1 : null;

        const formattedUsers = users.map(user => ({
            userId: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            phone: user.phone,
            activePlan: user.activePlan
                ? {
                    planId: user.activePlan._id,
                    planName: user.activePlan.planName,
                    price: user.activePlan.price,
                    duration: user.activePlan.duration
                }
                : null,
            planActivation: user.planActivation,
            planExpiry: user.planExpiry,
            business: user.business
                ? {
                    businessId: user.business._id,
                    businessName: user.business.businessName,
                    address: user.business.address
                }
                : null,
            createdAt: moment(user.createdAt).format("YYYY-MM-DD"),
        }));

        res.status(200).json({
            users: formattedUsers,
            meta: {
                totalUsers,
                totalPages,
                currentPage: pageNumber,
                pageLimit: limitNumber,
                nextPage,
                previousPage,
            },
            message: "Users Fetched Successfully"
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
}

async function deleteUserById(req, res) {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        const deletedUser = await User.findByIdAndDelete({_id: userId});

        res.status(200).json({
            deletedUser: deletedUser, 
            message: "User deleted successfully!" 
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Error deleting user", error: error.message 
        });
    }
}

module.exports = {
    getAllUsers: getAllUsers,
    deleteUserById: deleteUserById
}