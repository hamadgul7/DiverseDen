const Order = require('../model/orders-model');


async function addOrderDetails(req, res) {
    const { data, cartItems } = req.body;
    try {
        const userId = cartItems.find(item => item.userId)?.userId;
        if (!userId) {
            return res.status(400).json({ message: "No user ID found" });
        }

        const userInfo = {
            firstname: data.firstName,
            lastname: data.lastName,
            email: data.email,
            address: data.address,
            city: data.city,
            postal: data.postal,
            phone: data.phone,
            paymentMethod: data.paymentMethod
        };

        
        const businessGroups = cartItems.reduce((acc, item) => {
            const businessId = item.productId.business;
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

async function getOrders(req, res){
    const { business } = req.query;
    try{
        if(!business){
            return res.status(400).json({message: "Business ID not found"})
        }

        const businessOrders = await Order.find({businessId: business}).populate('cartItems');
        if(!businessOrders){
            return res.status(200).json({message: "No Orders found!"})
        }

        res.status(200).json({
            businessOrders,
            message: "Orders retrieved Successfully"
        })

    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    addOrderDetails: addOrderDetails,
    getOrders: getOrders
}