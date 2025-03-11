const Order = require('../model/orders-model');
require("dotenv").config();
const { Branch } = require('../model/Branch Owner/business-model');
const Product = require('../model/Branch Owner/products-model')
const nodemailer = require('nodemailer'); 
const BranchProduct = require('../model/Branch Owner/branchProduct-model')


async function addOrderDetails(req, res) {

    // const { data, cartItems, orderType, shippingCost } = req.body;

    // console.log("Received Data:", data);
    // console.log("OrderType:", orderType);
    // console.log("Cart Items:", cartItems);

    // try {
    //     // **Populate business field in cartItems**
    //     const populatedCartItems = await Promise.all(cartItems.map(async (item) => {
    //         return await Product.findById(item.productId).populate('product').lean();
    //     }));

    //     console.log(populatedCartItems)

    //     // **Ensure User ID Exists**
    //     const userId = cartItems.find(item => item.userId)?.userId;
    //     if (!userId) {
    //         return res.status(400).json({ message: "No user ID found" });
    //     }

    //     // **Extract User Info**
    //     const userInfo = {
    //         firstname: data.firstName,
    //         lastname: data.lastName,
    //         email: data.email,
    //         address: data.address,
    //         city: data.city,
    //         postal: data.postal,
    //         phone: data.phone,
    //         paymentMethod: data.paymentMethod
    //     };

    //     // **Group Cart Items by Business**
    //     const businessGroups = populatedCartItems.reduce((acc, product) => {
    //         if (!product || !product.business) {
    //             console.error(`Product ${product?._id} is missing business information.`);
    //             return acc; // Skip this product
    //         }

    //         const businessId = product.business._id.toString();

    //         if (!acc[businessId]) {
    //             acc[businessId] = {
    //                 business: product.business,
    //                 items: []
    //             };
    //         }

    //         acc[businessId].items.push(product);
    //         return acc;
    //     }, {});

    //     const createdOrders = [];

    //     // **Process Orders for Each Business**
    //     for (const [businessId, { business, items }] of Object.entries(businessGroups)) {
    //         console.log(`Processing Order for Business: ${business.name} (ID: ${businessId})`);

    //         // **Find Main Branch**
    //         const mainBranch = await Branch.findOne({
    //             business: new mongoose.Types.ObjectId(businessId),
    //             hasMainBranch: true
    //         });

    //         if (!mainBranch) {
    //             console.error(`No main branch found for business ${business.name}`);
    //             return res.status(400).json({
    //                 message: `No main branch found for business ${business.name}`
    //             });
    //         }

    //         // **Inventory Deduction**
    //         for (const item of items) {
    //             const { _id: productId, variants } = item;
    //             const { selectedVariant, quantity } = cartItems.find(ci => ci.productId === productId) || {};

    //             // **Find the Variant Matching the Selected Variant**
    //             const variant = variants.find(v =>
    //                 v.size === selectedVariant.size &&
    //                 v.material === selectedVariant.material
    //             );

    //             if (!variant) {
    //                 console.error(`Variant not found for Product ${productId}`);
    //                 return res.status(404).json({ message: `Variant not found for Product ${productId}` });
    //             }

    //             // **Find the Color within the Variant**
    //             const colorVariant = variant.colors.find(c => c.color === selectedVariant.color);
    //             if (!colorVariant) {
    //                 console.error(`Color variant not found for Product ${productId}`);
    //                 return res.status(404).json({ message: `Color variant not found for Product ${productId}` });
    //             }

    //             // **Check Stock and Deduct Inventory**
    //             if (colorVariant.quantity < quantity) {
    //                 console.error(`Not enough stock for Product ${productId}, Color ${selectedVariant.color}`);
    //                 return res.status(400).json({
    //                     message: `Not enough stock for Product ${productId}, Color ${selectedVariant.color}`
    //                 });
    //             }

    //             colorVariant.quantity -= quantity;
    //             variant.variantTotal -= quantity;
    //             item.totalQuantity -= quantity;
    //             item.totalAssignedQuantity -= quantity;

    //             await Product.findByIdAndUpdate(productId, item);
    //         }

    //         // **Calculate Order Totals**
    //         const subTotal = items.reduce((total, item) => total + (item.price * cartItems.find(ci => ci.productId === item._id)?.quantity || 1), 0);
    //         const totalAmount = subTotal + shippingCost;

    //         // **Create Order**
    //         const orderData = {
    //             businessId,
    //             businessName: business.name,
    //             userId,
    //             userInfo,
    //             branchCode: mainBranch.branchCode,
    //             cartItems: items.map(item => ({
    //                 productId: item._id,
    //                 title: item.title,
    //                 price: item.price,
    //                 quantity: cartItems.find(ci => ci.productId === item._id)?.quantity || 1,
    //                 selectedVariant: cartItems.find(ci => ci.productId === item._id)?.selectedVariant || {}
    //             })),
    //             status: 'Pending',
    //             orderType,
    //             subTotal,
    //             shippingCost,
    //             totalAmount
    //         };

    //         const order = new Order(orderData);
    //         await order.save();
    //         createdOrders.push(order);
    //     }

    //     // **Return Response**
    //     res.status(201).json({
    //         message: "Orders created successfully",
    //         orders: createdOrders.map(order => ({
    //             orderId: order._id,
    //             businessId: order.businessId,
    //             businessName: order.businessName,
    //             branchCode: order.branchCode,
    //             totalAmount: order.totalAmount
    //         }))
    //     });

    // } catch (error) {
    //     console.error('Error processing order:', error);
    //     res.status(500).json({
    //         message: "Internal server error",
    //         error: error.message
    //     });
    // }



    const { data, cartItems, orderType, shippingCost } = req.body;
console.log("CartItems Details", cartItems);

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
        const mainBranch = await Branch.findOne({
            business: businessId,
            hasMainBranch: true
        });

        if (!mainBranch) {
            return res.status(400).json({
                message: `No main branch found for business ${businessId}`
            });
        }

        // **Inventory Deduction**
        for (const item of items) {
            const { productId, selectedVariant, quantity } = item;

            // Find the product in the database
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${productId} not found` });
            }

            // Find the variant matching the selected variant
            const variant = product.variants.find(v => 
                v.size === selectedVariant.size &&
                v.material === selectedVariant.material
            );

            if (!variant) {
                return res.status(404).json({ message: `Variant not found for Product ${productId}` });
            }

            // Find the color within the variant
            const colorVariant = variant.colors.find(c => c.color === selectedVariant.color);
            if (!colorVariant) {
                return res.status(404).json({ message: `Color variant not found for Product ${productId}` });
            }

            // **Deduct inventory**
            if (colorVariant.quantity < quantity) {
                return res.status(400).json({ message: `Not enough stock for Product ${productId}, Color ${selectedVariant.color}` });
            }

            colorVariant.quantity -= quantity; // Reduce color quantity
            variant.variantTotal -= quantity; // Reduce variant total
            product.totalQuantity -= quantity; // Reduce total product quantity

            await product.save(); // Save updated product
        }

        const subTotal = items.reduce((total, item) => total + (item.productId.price * item.quantity), 0);
        const totalAmount = subTotal + shippingCost;

        const orderData = {
            businessId,
            userId,
            userInfo,
            branchCode: mainBranch.branchCode, 
            cartItems,
            status: 'Pending',
            orderType: orderType,
            subTotal,
            shippingCost,
            totalAmount
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
            branchCode: order.branchCode, 
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








    // const { data, cartItems, orderType, shippingCost } = req.body;
    // console.log("Data", data)
    // console.log("OrderType", data)
    // console.log("CartItems Details", cartItems);

    // try {
    //     const userId = cartItems.find(item => item.userId)?.userId;
    //     if (!userId) {
    //         return res.status(400).json({ message: "No user ID found" });
    //     }

    //     const userInfo = {
    //         firstname: data.firstName,
    //         lastname: data.lastName,
    //         email: data.email,
    //         address: data.address,
    //         city: data.city,
    //         postal: data.postal,
    //         phone: data.phone,
    //         paymentMethod: data.paymentMethod
    //     };

    //     const businessGroups = cartItems.reduce((acc, item) => {
    //         const businessId = item.productId.business;
    //         if (!acc[businessId]) {
    //             acc[businessId] = [];
    //         }
    //         acc[businessId].push(item);
    //         return acc;
    //     }, {});

    //     const createdOrders = [];

    //     for (const [businessId, items] of Object.entries(businessGroups)) {
    //         const mainBranch = await Branch.findOne({
    //             business: businessId,
    //             hasMainBranch: true
    //         });

    //         if (!mainBranch) {
    //             return res.status(400).json({
    //                 message: `No main branch found for business ${businessId}`
    //             });
    //         }

    //         // **Inventory Deduction**
    //         for (const item of items) {
    //             const { productId, selectedVariant, quantity } = item;

    //             // Find the product in the database
    //             const product = await Product.findById(productId);
    //             if (!product) {
    //                 return res.status(404).json({ message: `Product ${productId} not found` });
    //             }

    //             // Find the variant matching the selected variant
    //             const variant = product.variants.find(v => 
    //                 v.size === selectedVariant.size &&
    //                 v.material === selectedVariant.material
    //             );

    //             if (!variant) {
    //                 return res.status(404).json({ message: `Variant not found for Product ${productId}` });
    //             }

    //             // Find the color within the variant
    //             const colorVariant = variant.colors.find(c => c.color === selectedVariant.color);
    //             if (!colorVariant) {
    //                 return res.status(404).json({ message: `Color variant not found for Product ${productId}` });
    //             }

    //             // **Deduct inventory**
    //             if (colorVariant.quantity < quantity) {
    //                 return res.status(400).json({ message: `Not enough stock for Product ${productId}, Color ${selectedVariant.color}` });
    //             }

    //             colorVariant.quantity -= quantity; // Reduce color quantity
    //             variant.variantTotal -= quantity; // Reduce variant total
    //             product.totalQuantity -= quantity; // Reduce total product quantity
    //             product.totalAssignedQuantity -= quantity; // Reduce assigned quantity

    //             await product.save(); // Save updated product
    //         }

    //         const subTotal = items.reduce((total, item) => total + (item.productId.price * item.quantity), 0);
    //         const totalAmount = subTotal + shippingCost;

    //         const orderData = {
    //             businessId,
    //             userId,
    //             userInfo,
    //             branchCode: mainBranch.branchCode, 
    //             cartItems,
    //             status: 'Pending',
    //             orderType: orderType,
    //             subTotal,
    //             shippingCost,
    //             totalAmount
    //         };

    //         const order = new Order(orderData);
    //         await order.save();
    //         createdOrders.push(order);
    //     }

    //     res.status(201).json({ 
    //         message: "Orders created successfully", 
    //         orders: createdOrders.map(order => ({
    //             orderId: order._id,
    //             businessId: order.businessId,
    //             branchCode: order.branchCode, 
    //             totalAmount: order.totalAmount
    //         }))
    //     });
    // } 
    // catch (error) {
    //     console.error('Error processing order:', error);
    //     res.status(500).json({ 
    //         message: "Internal server error", 
    //         error: error.message 
    //     });
    // }





    // const { data, cartItems, orderType, shippingCost } = req.body;
    // console.log("CartItems Details",cartItems)
    // try {
    //     const userId = cartItems.find(item => item.userId)?.userId;
    //     if (!userId) {
    //         return res.status(400).json({ message: "No user ID found" });
    //     }

    //     const userInfo = {
    //         firstname: data.firstName,
    //         lastname: data.lastName,
    //         email: data.email,
    //         address: data.address,
    //         city: data.city,
    //         postal: data.postal,
    //         phone: data.phone,
    //         paymentMethod: data.paymentMethod
    //     };

    //     const businessGroups = cartItems.reduce((acc, item) => {
    //         const businessId = item.productId.business;
    //         if (!acc[businessId]) {
    //             acc[businessId] = [];
    //         }
    //         acc[businessId].push(item);
    //         return acc;
    //     }, {});

    //     const createdOrders = [];

    //     for (const [businessId, items] of Object.entries(businessGroups)) {
    //         const mainBranch = await Branch.findOne({
    //             business: businessId,
    //             hasMainBranch: true
    //         });

    //         if (!mainBranch) {
    //             return res.status(400).json({
    //                 message: `No main branch found for business ${businessId}`
    //             });
    //         }

    //         const subTotal = items.reduce((total, item) => total + (item.productId.price * item.quantity), 0);
    //         const totalAmount = subTotal + shippingCost;

    //         const orderData = {
    //             businessId,
    //             userId,
    //             userInfo,
    //             branchCode: mainBranch.branchCode, 
    //             cartItems,
    //             status: 'Pending',
    //             orderType: orderType,
    //             subTotal,
    //             shippingCost,
    //             totalAmount
    //         };

    //         const order = new Order(orderData);
    //         await order.save();
    //         createdOrders.push(order);
    //     }

    //     res.status(201).json({ 
    //         message: "Orders created successfully", 
    //         orders: createdOrders.map(order => ({
    //             orderId: order._id,
    //             businessId: order.businessId,
    //             branchCode: order.branchCode, 
    //             totalAmount: order.totalAmount
    //         }))
    //     });
    // } 
    // catch (error) {
    //     console.error('Error processing order:', error);
    //     res.status(500).json({ 
    //         message: "Internal server error", 
    //         error: error.message 
    //     });
    // }




    // const { data, cartItems, orderType } = req.body;
    
    // try {
    //     const userId = cartItems.find(item => item.userId)?.userId;
    //     if (!userId) {
    //         return res.status(400).json({ message: "No user ID found" });
    //     }
    
    //     const userInfo = {
    //         firstname: data.firstName,
    //         lastname: data.lastName,
    //         email: data.email,
    //         address: data.address,
    //         city: data.city,
    //         postal: data.postal,
    //         phone: data.phone,
    //         paymentMethod: data.paymentMethod
    //     };
    
    //     const businessGroups = cartItems.reduce((acc, item) => {
    //         const businessId = item.productId.business;
    //         if (!acc[businessId]) {
    //             acc[businessId] = [];
    //         }
    //         acc[businessId].push(item);
    //         return acc;
    //     }, {});
    
    //     const createdOrders = [];
    
    //     for (const [businessId, items] of Object.entries(businessGroups)) {
    //         const mainBranch = await Branch.findOne({
    //             business: businessId,
    //             hasMainBranch: true
    //         }).populate("business");
    
    //         if (!mainBranch) {
    //             return res.status(400).json({
    //                 message: `No main branch found for business ${businessId}`
    //             });
    //         }
    
    //         const businessName = mainBranch.business?.name || "Your Business";
    
    //         const orderData = {
    //             businessId,
    //             userId,
    //             userInfo,
    //             branchCode: mainBranch.branchCode,
    //             cartItems: items.map(item => item.productId._id),
    //             status: 'Pending',
    //             orderType,
    //             totalAmount: items.reduce((total, item) => total + (item.productId.price * item.quantity), 0)
    //         };
    
    //         const order = new Order(orderData);
    //         await order.save();
    //         createdOrders.push(order);
    
    //         const productList = items
    //             .map(
    //                 (item) => `
    //                 <tr>
    //                     <td style="border:1px solid #ddd; padding:8px; text-align:center;">
    //                         <img src="${item.productId.imagePath[0]}" alt="${item.productId.title}" style="width:100px; height:auto; border-radius:5px;">
    //                     </td>
    //                     <td style="border:1px solid #ddd; padding:8px; text-align:center;">
    //                         ${item.productId.title}
    //                     </td>
    //                     <td style="border:1px solid #ddd; padding:8px; text-align:center;">
    //                         ${item.quantity}
    //                     </td>
    //                     <td style="border:1px solid #ddd; padding:8px; text-align:center;">
    //                         $${item.productId.price * item.quantity}
    //                     </td>
    //                 </tr>
    //             `
    //             )
    //             .join("");
    
    //         const emailHTML = `
    //             <div style="font-family:Arial, sans-serif; line-height:1.6;">
    //                 <h2>Hello ${data.firstName},</h2>
    //                 <p>Thank you for your order! Here are your order details:</p>
    //                 <h3>Order Summary:</h3>
    //                 <table style="width:100%; border-collapse: collapse;">
    //                     <tr>
    //                         <th style="border:1px solid #ddd; padding:8px;">Product</th>
    //                         <th style="border:1px solid #ddd; padding:8px;">Name</th>
    //                         <th style="border:1px solid #ddd; padding:8px;">Quantity</th>
    //                         <th style="border:1px solid #ddd; padding:8px;">Total</th>
    //                     </tr>
    //                     ${productList}
    //                 </table>
    //                 <p>We appreciate your interest!</p>
    //                 <p><strong>Best Regards,</strong><br>${businessName}</p>
    //             </div>
    //         `;
    
    //         const transporter = nodemailer.createTransport({
    //             host: "smtp.gmail.com",
    //             port: 465,
    //             secure: true,
    //             auth: {
    //                 user: process.env.EMAIL_USER,
    //                 pass: process.env.EMAIL_PASSWORD
    //             },
    //             tls: { rejectUnauthorized: false }
    //         });
    
    //         const mailOptions = {
    //             from: process.env.EMAIL_USER,
    //             to: data.email,
    //             subject: "Order Confirmation",
    //             html: emailHTML 
    //         };
    
    //         try {
    //             await transporter.sendMail(mailOptions);
    //             console.log(`Order confirmation email sent successfully for business: ${businessName}`);
    //         } catch (emailError) {
    //             console.error(`Failed to send order confirmation email for ${businessName}:`, emailError);
    //         }
    //     }
    
    //     res.status(201).json({
    //         message: "Orders created successfully",
    //         orders: createdOrders.map(order => ({
    //             orderId: order._id,
    //             businessId: order.businessId,
    //             branchCode: order.branchCode,
    //             totalAmount: order.totalAmount
    //         }))
    //     });
    // } catch (error) {
    //     console.error("Error processing order:", error);
    //     res.status(500).json({
    //         message: "Internal server error",
    //         error: error.message
    //     });
    // }
     
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

async function getSalespersonOrders(req, res){
    const { branchCode, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
        }

        if (!branchCode) {
            return res.status(400).json({ message: "Branch Code is required" });
        }

        const branchOrders = await Order.find({ branchCode }).populate('cartItems');

        if (!branchOrders.length) {
            return res.status(200).json({ message: "No Orders found!!!!!" });
        }

        const ordersWithItemCount = branchOrders.map(order => ({
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
            branchOrders: paginatedOrders,
            meta: {
                totalOrders,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Orders retrieved successfully",
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function assignOrderToBranch(req, res){

    try {
        const { orderId, branch, cartItems } = req.body;

        console.log("heyyyyyyyyy", cartItems)
    
        if (!orderId || !branch?.branchCode) {
            return res.status(400).json({ message: "Invalid Order ID or Branch Code" });
        }
    
        // Find and update the order with the new branch assignment
        const orderDetails = await Order.findByIdAndUpdate(
            orderId,
            { $set: { branchCode: branch.branchCode } },
            { new: true } 
        );
    
        if (!orderDetails) {
            return res.status(404).json({ message: "Order not found" });
        }
    
        // Process inventory deduction in BranchProduct model
        for (const cartItem of cartItems) {
            const { productId, selectedVariant, quantity } = cartItem;
    
            // Find the branch product using productId and branchCode
            const branchProduct = await BranchProduct.findOne({
                product: productId,
                branchCode: branch.branchCode
            });
    
            if (!branchProduct) {
                console.warn(`BranchProduct not found for Product ID: ${productId} in Branch ${branch.branchCode}`);
                continue; // Skip this item if the branch product is not found
            }
    
            // Find the correct variant inside branchProduct
            const variant = branchProduct.variants.find(v => 
                v.size === selectedVariant.size && v.material === selectedVariant.material
            );
    
            if (!variant) {
                console.warn(`Variant not found for Product ID: ${productId} with selected variant`);
                continue;
            }
    
            // Find the correct color variant and subtract quantity
            const colorVariant = variant.colors.find(c => c.color === selectedVariant.color);
            
            if (!colorVariant) {
                console.warn(`Color Variant not found for Product ID: ${productId} with color: ${selectedVariant.color}`);
                continue;
            }
    
            // Ensure the quantity does not go below zero
            if (colorVariant.quantity < quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${branchProduct.title} in color ${selectedVariant.color}`
                });
            }
    
            colorVariant.quantity -= quantity; // Subtract quantity from the specific variant
            branchProduct.totalBranchQuantity -= quantity; // Subtract from total branch quantity
    
            await branchProduct.save(); // Save updated branch product inventory
        }
    
        res.status(200).json({
            orderDetails,
            message: "Order Assigned To Branch Successfully, Inventory Updated"
        });
    
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
    



    // try {
    //     const { orderId, branch, cartItems } = req.body;
        
    
    //     if (!orderId || !branch?.branchCode) {
    //         return res.status(400).json({ message: "Invalid Order ID or Branch Code" });
    //     }
    
    //     const orderDetails = await Order.findByIdAndUpdate(
    //         orderId,
    //         { $set: { branchCode: branch.branchCode } },
    //         { new: true } 
    //     );
    
    //     if (!orderDetails) {
    //         return res.status(404).json({ message: "Order not found" });
    //     }
    
    //     res.status(200).json({
    //         orderDetails,
    //         message: "Order Assigned To Branch Successfully"
    //     });
    
    // } catch (error) {
    //     res.status(400).json({ message: "Server Error", error: error.message });
    // }    
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
    getSalespersonOrders, getSalespersonOrders,
    assignOrderToBranch: assignOrderToBranch,
    updateOrderStatus: updateOrderStatus,
    deleteOrder: deleteOrder
}