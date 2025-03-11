const { Business } = require('../../model/Branch Owner/business-model');
const User  = require('../../model/auth-model');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function addBusiness(req,res){
    const {name, description, user, accountHolderName, bankName, accountNumber} = req.body;
    try{
        const businessData = {
            name: capitalizeFirstLetter(name),
            description: capitalizeFirstLetter(description),
            user,
            accountHolderName: capitalizeFirstLetter(accountHolderName),
            bankName,
            accountNumber
        }

        const businessInfo = await Business.findOne({name});
        if(businessInfo){
            return res.status(400).json({
                message: "Business Name Already Exists"
            })
        }

        const business = new Business(businessData);

        const newBusiness = await business.save();
        const userInfo = await User.findById(user);
        if (userInfo && userInfo.role === 'Branch Owner') {
            userInfo.business = newBusiness._id;
            await userInfo.save();
        }
        res.status(201).json({
            newBusiness,
            message: "Business Added Successfully"
        })

    }
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function verifyBusiness(req, res){
    const { businessId } = req.query;
    try {
        const business = await Business.findById(businessId);
        console.log(business)

        let businessDetails = [];

        let businessExist = false;
        if (business) {
            businessDetails.push({
                _id: business._id,
                name: business.name,
                description: business.description,
                branches: business.branches,
                user: business.user,
                accountHolderName: business.accountHolderName,
                bankName: business.bankName,
                accountNumber: business.accountNumber,
                createdAt: business.createdAt,
                updatedAt: business.updatedAt
            });

            businessExist = true;
        }

        return res.json({
            businessDetails,
            businessExist
        }
            
        );

    } catch (error) {
        console.error("Error fetching business details:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}


module.exports = {
    addBusiness: addBusiness,
    verifyBusiness: verifyBusiness
}