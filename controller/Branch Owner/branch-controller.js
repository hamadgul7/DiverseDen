const { Branch, Business } = require('../../model/Branch Owner/business-model');
const Product = require('../../model/Branch Owner/products-model');
const Salesperson = require('../../model/Branch Owner/salesperson-model');
const BranchProduct = require('../../model/Branch Owner/branchProduct-model');
const User = require('../../model/auth-model');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}  

async function getBranchbyId(req, res){
    const { branchId } = req.query;
    try{
        const branches = await Branch.find({_id: branchId}).populate({
            path: 'salesperson',
            select: 'name'
        });
        if(!branches){
            return res.status(404).json({message: "No branch Found"})
        }

        res.status(200).json({
            branches,
            message: "Branch Retrieved Successfully"
        })
    } 
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function allBranches(req, res){
    const { business } = req.query;
    try{
        const branches = await Branch.find({business: business}).populate({
            path: 'salesperson',
            select: 'name'
        });
        if(branches.length == 0){
            return res.status(404).json({message: "No branches Found"})
        }

        res.status(200).json({
            branches,
            message: "All branches are here"
        })
    } 
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function viewBranches(req, res) {
    const { business, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "PageNo and page limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * pageLimit;

        const branches = await Branch.find({ business: business })
            .populate({ path: 'salesperson', select: 'name' })
            .skip(skip)
            .limit(pageLimit);

        const totalBranches = await Branch.countDocuments({ business: business });
        const totalPages = Math.ceil(totalBranches / pageLimit);

        if (branches.length === 0) {
            return res.status(404).json({ message: "No branches found." });
        }

        let nextPage = null;
        if (pageNumber < totalPages) {
            nextPage = pageNumber + 1;
        }

        let previousPage = null;
        if (pageNumber > 1) {
            previousPage = pageNumber - 1;
        }


        res.status(200).json({
            branches,
            meta: {
                totalItems: totalBranches,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Branches retrieved successfully.",
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function createBranch(req, res){
    const { branchCode, name, city, address, contactNo, emailAddress, business, isMainBranch, user } = req.body;

    if(isMainBranch){
        await User.findByIdAndUpdate(
            user._id,
            {
                $set: {hasMainBranch: true }
            }
        )       
    }

    try {
        const capitalizedData = {
            branchCode: capitalizeFirstLetter(branchCode),
            name: capitalizeFirstLetter(name),
            city: capitalizeFirstLetter(city),
            address: capitalizeFirstLetter(address),
            contactNo,
            emailAddress,
            business,
            hasMainBranch: isMainBranch
        };

        const businessExist = await Business.findById(business).populate("user"); 
        if (!businessExist) {
            return res.status(404).json({ message: "Business Not Found" });
        }

        const businessOwner = await User.findById(businessExist.user).populate("activePlan");

        if (!businessOwner) {
            return res.status(404).json({ message: "Business owner not found." });
        }

        if (!businessOwner.activePlan) {
            return res.status(403).json({ message: "You must have an active subscription plan to add branches." });
        }

        if (businessOwner.planExpiry && new Date() > new Date(businessOwner.planExpiry)) {
            return res.status(403).json({ message: "Your subscription has expired. Please renew your plan." });
        }

        const branchLimit = businessOwner.activePlan.noOfBranches || 0;

        const branchCount = await Branch.countDocuments({ business });

        if (branchCount >= branchLimit) {
            return res.status(403).json({ message: `Branch limit reached! Your plan allows only ${branchLimit} branches.` });
        }

        const branchExist = await Branch.findOne({ branchCode: branchCode, business: business });
        if (branchExist) {
            return res.status(409).json({ message: "Branch already exists within this business." });
        }

        const branch = new Branch(capitalizedData);
        const newBranch = await branch.save();

        const assignBranchToBusiness = await Business.findByIdAndUpdate(
            business,
            { $push: { branches: newBranch._id } },
            { new: true, runValidators: true }
        );

        if (!assignBranchToBusiness) {
            return res.status(404).json({ message: "Business Not Found" });
        }

        res.status(201).json({
            newBranch,
            message: "Branch Created Successfully"
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function updateBranch(req, res){
    const {branchCode, name, city, address, contactNo, emailAddress, business} = req.body;
    try{
        const capitalizedData = {
            branchCode: capitalizeFirstLetter(branchCode),
            name: capitalizeFirstLetter(name),
            city: capitalizeFirstLetter(city),
            address: capitalizeFirstLetter(address),
            contactNo,
            emailAddress,
            business,
        };

        const updateData = {
            name: capitalizedData.name,
            city: capitalizedData.city,
            address: capitalizedData.address,
            contactNo: capitalizedData.contactNo,
            emailAddress: capitalizedData.emailAddress
        };

        const branch = await Branch.findOneAndUpdate(
            { 
                branchCode: branchCode, 
                business: business 
            },
            updateData, 
            { new: true, runValidators: true } 
        );

        if(!branch){
            return res.status(404).json({message: "Branch Not Found!"})
        }

        res.status(201).json({
            branch,
            message: "Branch Updated successfully"
        })

    }
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function deleteBranch(req, res) {
    const { branchCode, business } = req.body;
    try {
        const branch = await Branch.findOneAndDelete({ branchCode, business });

        if (!branch) {
            return res.status(404).json({ message: "Branch Not Found!" });
        }

        const branchId = branch._id;

        await Business.findByIdAndUpdate(
            business,
            { $pull: { branches: branchId } }
        );

        const branchProducts = await BranchProduct.find({ branchCode });

        for (const branchProduct of branchProducts) {
            await Product.findByIdAndUpdate(
                branchProduct.product,
                {
                    $inc: { totalAssignedQuantity: -branchProduct.totalBranchQuantity },
                    $pull: { branch: branchCode } 
                }
            );

            await BranchProduct.findByIdAndDelete(branchProduct._id);
        }

        await Branch.updateMany(
            { _id: branchId },
            { $set: { products: [] } }
        );

        if (branch.salesperson) {
            await Salesperson.findByIdAndDelete(branch.salesperson);
        }

        if (branch.hasMainBranch) {
            await User.findOneAndUpdate(
                { business }, 
                { $set: { hasMainBranch: false } }
            );
        }

        res.status(200).json({ message: "Branch and associated products deleted successfully" });

    } catch (error) {
        console.error("Error deleting branch:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    getBranchbyId: getBranchbyId,
    allBranches: allBranches,
    viewBranches: viewBranches,
    createBranch: createBranch,
    updateBranch: updateBranch,
    deleteBranch: deleteBranch
}