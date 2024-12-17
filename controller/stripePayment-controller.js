const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')("sk_test_51QOJ4oDZzPFomXhELbCh0GyE8sZhUC8XbEMxBKsK9cZtvKzbIZJh45yzTesWu0sXlGAEoh0ndkJKW44ANd98VTBd0050p9NpIL");
const User = require('../model/auth-model');
const Plan = require('../model/subscriptionPlans-model')

async function planPayment(req, res){
    const { planName, token , userId} = req.body;   
    const plan = await Plan.findOne({name: planName});
    const idempontencyKey = uuidv4();

    try{
        const customer = await stripe.customers.create({
            email: token.email
        });

        await stripe.customers.createSource(customer.id, {
            source: token.id,  
        });

        const result = await stripe.charges.create(
            {
                amount: plan.price * 100,
                currency: 'usd',
                customer: customer.id,
                description: plan.name
            },
            {
                idempotencyKey: idempontencyKey, 
            }
        );

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            {
                activePlan: plan._id, 
                planExpiry: expiryDate, 
            },
            { new: true }
        );

        res.status(200).json({
            payment: result,
            user: updatedUser,
            message: "Payment successful, plan activated!",
        });
        // console.log("Successfull Payment")
        // return res.status(200).json({
        //     result,
        //     message: "Payment successful, plan activated!",
        // });


    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: "Payment failed", error: err.message });
    }           
}


async function orderPayment(req, res){
    const { totalAmount, token} = req.body;   
    const idempontencyKey = uuidv4();

    try{
        const customer = await stripe.customers.create({
            email: token.email
        });

        await stripe.customers.createSource(customer.id, {
            source: token.id,  
        });

        const oneDollar = 277.90;
        const rupeesToDollar = parseInt(totalAmount / oneDollar);

        const result = await stripe.charges.create(
            {
                amount: rupeesToDollar * 100,
                currency: 'usd',
                customer: customer.id,
                description: ''
            },
            {
                idempotencyKey: idempontencyKey, 
            }
        );

        res.status(200).json({
            payment: result,
            message: "Payment successful",
        });

    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: "Payment failed", error: err.message });
    }           
}
module.exports = {
    planPayment: planPayment,
    orderPayment: orderPayment
};