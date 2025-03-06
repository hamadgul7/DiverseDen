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
        const { businessId } = req.query; // Get businessId from query parameters

        if (!businessId) {
            return res.status(400).json({ message: "Business ID is required" });
        }

        const saleEvents = await SaleEvent.find({ businessId }).populate("products.productId");

        if (saleEvents.length === 0) {
            return res.status(404).json({ message: "No sale events found for this business" });
        }

        const currentDate = new Date(); // Get current date

        const formattedEvents = saleEvents.map(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);

            // Determine status based on date
            let status = "Upcoming";
            if (currentDate >= startDate && currentDate <= endDate) {
                status = "Ongoing";
            } else if (currentDate > endDate) {
                status = "Expired";
            }

            return {
                eventId: event._id, // Include the event ID
                name: event.eventName, // Ensure correct field name
                description: event.description,
                duration: `${moment(event.startDate).format("MMM D, YYYY")} - ${moment(event.endDate).format("MMM D, YYYY")}`,
                discount: event.discountType === "percentage" 
                    ? `${event.discountValue}% Off` 
                    : `$${event.discountValue} Off`,
                products: event.products.length,
                status // Include status in response
            };
        });

        res.status(200).json(formattedEvents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sale events", error: error.message });
    }
}

async function viewASaleEventById(req, res){
    try {
        const { eventId } = req.query; // Get event ID from URL params

        if (!eventId) {
            return res.status(400).json({ message: "Event ID is required" });
        }

        // Fetch the sale event and populate the product details
        const saleEvent = await SaleEvent.findById(eventId);

        if (!saleEvent) {
            return res.status(404).json({ message: "Sale event not found" });
        }

        // Format the sale event response
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
                discountedPrice: `$${p.discountedPrice?.toFixed(2) || "0.00"}` // Extracting directly
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

// Function to Determine Sale Event Status
function getStatus(startDate, endDate) {
    const now = new Date();
    if (now < startDate) return "Upcoming";
    if (now > endDate) return "Expired";
    return "Active";
}

module.exports = {
    createSaleEvent: createSaleEvent,
    viewSaleEvents: viewSaleEvents,
    viewASaleEventById: viewASaleEventById
}