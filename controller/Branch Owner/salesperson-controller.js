const Salesperson = require('../../model/Branch Owner/salesperson-model');
const { Branch } = require('../../model/Branch Owner/business-model');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function viewSalesperson(req, res){
    const { business, pageNo, limit } = req.query;
    try{

        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "PageNo and page limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * pageLimit;

        const salesperson = await Salesperson.find({business: business})
        .skip(skip)
        .limit(pageLimit);

        const totalSalesperson = await Salesperson.countDocuments({business: business});
        const totalPages = Math.ceil(totalSalesperson/ pageLimit);

        if(salesperson.length === 0){
            return res.status(404).json({ message: "No Salesperson Found!" })
        }

        let nextPage = null;
        if(pageNumber < totalPages){
            nextPage = pageNumber + 1
        }

        let previousPage = null;
        if(pageNumber > 1){
            previousPage = pageNumber - 1
        }


        res.status(200).json({
            salesperson,
            meta: {
                totalItems: totalSalesperson,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Salesperson Retrived Successfully"
        })
    } 
    catch(error){
        res.status(400).json({ message: error.message });
    }
}

async function addSalesperson(req, res){
    const { name, email, assignBranch, business } = req.body;

    try{
        const salespersonData = {
            name: capitalizeFirstLetter(name),
            email,
            assignBranch,
            business
        }

        const existBranch = await Branch.findOne({
            branchCode: assignBranch,
            business: business
        });
        
        if(!existBranch){
            return res.status(404).json({message: "Branch Not Found!"})
        }

        if (existBranch.salesperson) {
            return res.status(400).json({ 
                message: "A salesperson is already assigned to this branch." 
            });
        }

        const salesperson = new Salesperson(salespersonData);

        const newSalesperson = await salesperson.save();
        const assignBranchToSalesperson = await Branch.findOneAndUpdate(
            {
                branchCode: assignBranch,
                business: business
            },
            { 
                $set: { salesperson: newSalesperson._id } 
            },  
            { new: true }
        );

        res.status(201).json({
            // assignBranchToSalesperson,
            newSalesperson,
            message: "Salesperson Added Successfully"
        })
    }
    catch(error){
        res.status(400).json({message: error.message})
    }
}

async function deleteSalesperson(req, res){
    const { salespersonId } = req.body;
    try{
        const salesperson = await Salesperson.findOneAndDelete({_id: salespersonId});

        if(!salesperson){
            return res.status(404).json({ message: "No Salesperson Found!" });
        }

        const updatedBranch = await Branch.findOneAndUpdate(
            { 
                branchCode: salesperson.assignBranch,
                business: salesperson.business 
            },
            { $unset: { salesperson: "" } }, 
            { new: true }
        );

        if(!updatedBranch){
            return res.status(400).json({ message: "Branch Not Found! For Removing Salesperson" })
        }

        res.status(200).json({
            message: "Salesperson Deleted Successfully"
        });
    }

    catch(error){
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    addSalesperson: addSalesperson,
    viewSalesperson: viewSalesperson,
    deleteSalesperson: deleteSalesperson
}