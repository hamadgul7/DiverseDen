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
    const { business, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
        }
        


        if (!business) {
            return res.status(400).json({ message: "Business ID not found" });
        }

        const businessOrders = await Order.find({ businessId: business }).populate('cartItems');

        if (!businessOrders || businessOrders.length === 0) {
            return res.status(200).json({ message: "No Orders found!!!!!" });
        }

        const ordersWithItemCount = businessOrders.map(order => ({
            ...order.toObject(),
            cartItemCount: order.cartItems.length || 0
        }));

        const startIndex = (pageNumber - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;

        const totalOrders = ordersWithItemCount.length; 
        const totalPages = Math.ceil(totalOrders / pageLimit);
        const paginatedOrders = ordersWithItemCount.slice(startIndex, endIndex); 

        const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        const previousPage = pageNumber > 1 ? pageNumber - 1 : null;
        
        res.status(200).json({
            businessOrders: paginatedOrders,
            meta: {
                totalOrders,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Orders retrieved Successfully",
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function updateOrderStatus(req, res){
    const { orderId, status } = req.body;
    try{
        if (!orderId) {
            return res.status(400).json({ message: "Invalid Order Id" });
        }

        const order = await Order.findByIdAndUpdate(orderId,
            {
                $set: {status: status}
            }
        )

        res.status(201).json({
            message: "Status Updated Successfully"
        })

    } catch(error){
        res.status(400).json({message: error.message})
    }
}

async function deleteOrder(req, res){
    const { orderId } = req.body;
    try{
        if(!orderId){
            return res.status(400).json({ message: "Invalid Order ID" })
        }

        const order = await Order.findByIdAndDelete(orderId);
        res.status(201).json({ message: "Order Deleted Successfully" })

    } catch(error){
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    addOrderDetails: addOrderDetails,
    getOrders: getOrders,
    updateOrderStatus: updateOrderStatus,
    deleteOrder: deleteOrder
}