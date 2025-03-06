const SaleEvent = require('../../model/Branch Owner/saleEvent-model');

async function createSaleEvent(req, res){
    try {
        const { eventName, description, startDate, endDate, discountType, discountValue, businessId, products } = req.body;
    
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
            eventName,
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

}

module.exports = {
    createSaleEvent: createSaleEvent
}