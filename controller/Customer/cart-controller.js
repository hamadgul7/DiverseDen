const Cart = require('../../model/Customer/cart-model');
const User = require('../../model/auth-model')

async function viewCart(req, res) {
    const { userId } = req.query;

    try {
        const userCart = await Cart.find({ userId: userId }).populate('productId');

        if (userCart.length === 0) {
            return res.status(200).json({ message: "No Products Found in Cart" });
        }

        const productsWithImages = userCart
            .filter(cartItem => cartItem.productId)
            .map(cartItem => {
                const product = cartItem.productId.toObject();
                return {
                    ...cartItem.toObject(),
                    productId: product,
                };
            });

        res.status(200).json({
            userCart: productsWithImages,
            message: "Cart Retrieved Successfully",
        });
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function addToCart(req, res) {
    const { userId, productId, quantity, selectedVariant } = req.body;
    try{

        const userExist = await User.findById(userId);
        if(!userExist){
            return res.status(404).json({ message: "Please first Login/signUp to Add Products in Cart" })
        }

        const cartProduct = new Cart({
            userId,
            productId,
            quantity,
            selectedVariant
        });

        await cartProduct.save();
        res.status(201).json({
            productId,
            message: "Product Added Successfully in Cart"
        })
    }
    catch(error){
        res.status(400).json({message: error.message})
    }  
}

async function updateProductQuantityInCart(req, res){
    const { cartId, quantity } = req.body;
    try{

        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1." });
        }

        const cartUpdatedProduct = await Cart.findByIdAndUpdate(
            cartId,
            {
                $set: {
                    quantity: quantity
                }
            },
            { new: true }
        )

        if(!cartUpdatedProduct){
            return res.status(404).json({message: "Cart Product Not found!"})
        }

        res.status(200).json({
            cartUpdatedProduct,
            message: "Quantity Successfully Updated"
        })

    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function deleteProductFromCart(req, res) {
    const { cartId } = req.body;
    try{
        const deletedCartProduct = await Cart.findByIdAndDelete(cartId);

        res.status(200).json({ message: "Product Deleted Successfully from cart" })
    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function emptyCart(req, res){
    const { userId } = req.body;
    try{
        const deletedItems = await Cart.deleteMany({userId: userId})
        if(!deletedItems){
            return res.status(200).json({message: `No Items found for user have Id: ${userId}`})
        }

        res.status(200).json({
            deletedItems,
            message: "Items deleted Successfully"
        })
    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}


module.exports = {
    viewCart: viewCart,
    addToCart: addToCart,
    updateProductQuantityInCart: updateProductQuantityInCart,
    deleteProductFromCart: deleteProductFromCart,
    emptyCart: emptyCart
}