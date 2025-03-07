const SaleEvent = require('../../model/Branch Owner/saleEvent-model');
const moment = require('moment');

async function createSaleEvent(req, res){
    try {
        const { name, description, startDate, endDate, discountType, discountValue, businessId, products } = req.body;
    
        if (!businessId) {
            return res.status(400).json({ message: "Invalid businessId format" });
        }
    
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products array must not be empty" });
        }
    
        const formattedProducts = products.map(product => ({
            productId: (product.productId), 
            name: product.name,
            category: product.category,
            price: product.price,
            discountedPrice: product.discountedPrice
        }));
    
        const saleEvent = new SaleEvent({
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            discountType,
            discountValue,
            businessId,
            products: formattedProducts 
        });
    
        await saleEvent.save();
    
        res.status(201).json({ 
            saleEvent,
            message: "Sale event created successfully" 
        });
    
    } catch (error) {
        res.status(500).json({ 
            message: "Error creating sale event", 
            error: error.message 
        });
    }
}

async function viewSaleEvents(req, res){
    try {
        const { businessId, pageNo, limit } = req.query;

        if (!businessId) {
            return res.status(400).json({ message: "Business ID is required" });
        }

        const pageNumber = parseInt(pageNo);
        const limitNumber = parseInt(limit);

        if (pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const totalEvents = await SaleEvent.countDocuments({ businessId });

        const saleEvents = await SaleEvent.find({ businessId })
            .populate("products.productId")
            .skip(skip)
            .limit(limitNumber);

        if (!saleEvents.length) {
            return res.status(200).json({
                events: [],
                meta: {
                    totalEvents,
                    totalPages: Math.ceil(totalEvents / limitNumber),
                    currentPage: pageNumber,
                    pageLimit: limitNumber,
                    nextPage: null,
                    previousPage: pageNumber > 1 ? pageNumber - 1 : null,
                },
                message: "No sale events found for this business"
            });
        }

        const totalPages = Math.ceil(totalEvents / limitNumber);
        const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        const previousPage = pageNumber > 1 ? pageNumber - 1 : null;

        const currentDate = new Date(); 

        const formattedEvents = saleEvents.map(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);

            let status = "Upcoming";
            if (currentDate >= startDate && currentDate <= endDate) {
                status = "Ongoing";
            } else if (currentDate > endDate) {
                status = "Expired";
            }

            return {
                eventId: event._id,
                name: event.name,
                description: event.description,
                duration: `${moment(event.startDate).format("MMM D, YYYY")} - ${moment(event.endDate).format("MMM D, YYYY")}`,
                discount: event.discountType === "percentage"
                    ? `${event.discountValue}% Off`
                    : `$${event.discountValue} Off`,
                products: event.products.length,
                status
            };
        });

        res.status(200).json({
            events: formattedEvents,
            meta: {
                totalEvents,
                totalPages,
                currentPage: pageNumber,
                pageLimit: limitNumber,
                nextPage,
                previousPage,
            },
            message: "Sales Events Fetched Successfully"
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching sale events", error: error.message });
    }
}

async function viewASaleEventById(req, res){
    try {
        const { eventId } = req.query; 

        if (!eventId) {
            return res.status(400).json({ message: "Event ID is required" });
        }

        const saleEvent = await SaleEvent.findById(eventId);

        if (!saleEvent) {
            return res.status(404).json({ message: "Sale event not found" });
        }

        const formattedEvent = {
            name: saleEvent.name,
            description: saleEvent.description,
            status: getStatus(saleEvent.startDate, saleEvent.endDate),
            discountType: saleEvent.discountType,
            discountValue: saleEvent.discountValue,
            duration: `${moment(saleEvent.startDate).format("M/D/YYYY")} - ${moment(saleEvent.endDate).format("M/D/YYYY")}`,
            productsIncluded: saleEvent.products.length,
            products: saleEvent.products.map(p => ({
                productId: p.productId,
                name: p.name,
                category: p.category,
                originalPrice: `$${p.price?.toFixed(2) || "0.00"}`,
                discountedPrice: `$${p.discountedPrice?.toFixed(2) || "0.00"}` 
            }))
        };

        res.status(200).json(formattedEvent);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching sale event details",
            error: error.message
        });
    }
};

function getStatus(startDate, endDate) {
    const now = new Date();
    if (now < startDate) return "Upcoming";
    if (now > endDate) return "Expired";
    return "Active";
}

async function updateSaleEvent(req, res) {
    try {
        const { eventId, name, description, startDate, endDate, discountType, discountValue, products } = req.body;

        if (!eventId) {
            return res.status(400).json({ message: "Sale event ID is required" });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products array must not be empty" });
        }

        const formattedProducts = products.map(product => ({
            productId: product.productId,
            name: product.name,
            category: product.category,
            price: product.price,
            discountedPrice: product.discountedPrice
        }));

        const updatedEvent = await SaleEvent.findByIdAndUpdate(
            eventId,
            {
                eventName: name, 
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                discountType,
                discountValue,
                products: formattedProducts
            },
            { new: true, runValidators: true } 
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: "Sale event not found" });
        }

        res.status(200).json({
            saleEvent: updatedEvent,
            message: "Sale event updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating sale event",
            error: error.message
        });
    }
}

async function deleteSaleEvent(req, res) {
    try {
        const { eventId } = req.query; 

        if (!eventId) {
            return res.status(400).json({ message: "Sale event ID is required" });
        }

        const deletedEvent = await SaleEvent.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            return res.status(404).json({ message: "Sale event not found" });
        }

        res.status(200).json({
            message: "Sale event deleted successfully",
            deletedEvent
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting sale event",
            error: error.message
        });
    }
}

module.exports = {
    createSaleEvent: createSaleEvent,
    viewSaleEvents: viewSaleEvents,
    viewASaleEventById: viewASaleEventById,
    updateSaleEvent: updateSaleEvent,
    deleteSaleEvent: deleteSaleEvent
}