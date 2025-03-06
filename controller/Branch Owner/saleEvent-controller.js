const SaleEvent = require('../../model/Branch Owner/saleEvent-model');
const mongoose = require('mongoose')

async function createSaleEvent(req, res){
    try {
        const { eventName, description, startDate, endDate, discountType, discountValue, businessId, products } = req.body;

        const productIds = products.map(productId => (productId));

        const saleEvent = new SaleEvent({
            eventName,
            description,
            startDate: new Date(startDate), 
            endDate: new Date(endDate),
            discountType,
            discountValue,
            businessId,
            products: productIds 
        });

        await saleEvent.save();

        res.status(201).json({ 
            saleEvent,
            message: "Sale event created successfully" });

    } catch (error) {
        res.status(500).json({ 
            message: "Error creating sale event", 
            error: error.message 
        });
    }
}

module.exports = {
    createSaleEvent: createSaleEvent
}