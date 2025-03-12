const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')("sk_test_51QOJ4oDZzPFomXhELbCh0GyE8sZhUC8XbEMxBKsK9cZtvKzbIZJh45yzTesWu0sXlGAEoh0ndkJKW44ANd98VTBd0050p9NpIL");
const User = require('../model/auth-model');
const Plan = require('../model/subscriptionPlans-model');
const moment = require("moment");
const nodemailer = require("nodemailer");
const axios = require("axios");


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
        expiryDate.setDate(expiryDate.getDate() + 30);
        const activationDate = moment().format("MMMM Do, YYYY");

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            {
                planActivation: activationDate,
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


const getExchangeRate = async () => {
    try {
        const response = await axios.get("https://v6.exchangerate-api.com/v6/e3b4fd0c02f8895f36cd7335/latest/USD");
        return response.data.conversion_rates.PKR; 
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return 280.90; 
    }
};

async function orderPayment(req, res){


    // Only for without email confirmaion
//     const { totalAmount, token} = req.body;   
//     const idempontencyKey = uuidv4();

//     try{
//         const customer = await stripe.customers.create({
//             email: token.email
//         });

//         await stripe.customers.createSource(customer.id, {
//             source: token.id,  
//         });

//         const oneDollar = 277.90;
//         const rupeesToDollar = parseInt(totalAmount / oneDollar);

//         const result = await stripe.charges.create(
//             {
//                 amount: rupeesToDollar * 100,
//                 currency: 'usd',
//                 customer: customer.id,
//                 description: ''
//             },
//             {
//                 idempotencyKey: idempontencyKey, 
//             }
//         );

//         res.status(200).json({
//             payment: result,
//             message: "Payment successful",
//         });

//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({ message: "Payment failed", error: err.message });
//     }    



    const { totalAmount, token } = req.body;
    console.log("Maaal", totalAmount)
    const idempotencyKey = uuidv4();

    try {
        const exchangeRate = await getExchangeRate(); 
        console.log("Current USD Exchange Rate:", exchangeRate);

        const customer = await stripe.customers.create({ email: token.email });
        await stripe.customers.createSource(customer.id, { source: token.id });

        const rupeesToDollar = parseFloat(totalAmount / exchangeRate).toFixed(2);

        const result = await stripe.charges.create(
            {
                amount: rupeesToDollar * 100, 
                currency: "usd",
                customer: customer.id,
                description: "Purchase from Diverse Den"
            },
            {
                idempotencyKey: idempotencyKey,
            }
        );

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: token.email,
            subject: "Payment Confirmation - Diverse Den",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello,</h2>
                    <p>Your payment of <strong>$${rupeesToDollar}</strong> has been successfully processed.</p>
                    <p><strong>Transaction ID:</strong> ${result.id}</p>
                    <p>Thank you for shopping with us!</p>
                    <p><strong>Best Regards,</strong><br>Diverse Den</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Payment confirmation email sent successfully!");

        res.status(200).json({
            payment: result,
            message: "Payment successful",
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Payment failed", error: err.message });
    }       
}

module.exports = {
    planPayment: planPayment,
    orderPayment: orderPayment
};