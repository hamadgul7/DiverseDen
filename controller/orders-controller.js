const Order = require('../model/orders-model');


async function addOrderDetails(req, res) {
    const { data, cartItems, totalAmount } = req.body;
    try {
        const userId = cartItems.find(item => item.userId)?.userId;
        if (!userId) {
            return res.status(400).json({ message: "No user ID found" });
        }

        const userInfo = {
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            address: data.address,
            city: data.city,
            postal: data.postal,
            phone: data.phone,
            paymentMethod: data.paymentMethod
        };

        const businessGroups = cartItems.reduce((acc, item) => {
            const businessId = item.productId.businessId;
            if (!acc[businessId]) {
                acc[businessId] = [];
            }
            acc[businessId].push(item);
            return acc;
        }, {});

        
        const createdOrders = [];
        for (const [businessId, items] of Object.entries(businessGroups)) {
            const orderData = {
                businessId,
                userId,
                userInfo,
                cartItems: items.map(item => item.productId._id),
                status: 'Pending',
                totalAmount: items.reduce((total, item) => 
                    total + (item.productId.price * item.quantity), 0)
            };

            const order = new Order(orderData);
            await order.save();
            createdOrders.push(order);
        }

        res.status(201).json({ 
            message: "Orders created successfully", 
            orders: createdOrders.map(order => ({
                orderId: order._id,
                businessId: order.businessId,
                totalAmount: order.totalAmount
            }))
        });
    } 
    catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
}

module.exports = {
    addOrderDetails: addOrderDetails
}