const express = require('express');
const db = require('./config/database');
const path = require('path');
const authRoute = require('./routes/auth-routes');
const subscriptionRoute = require('./routes/subscriptionPlans-route');
const planStripePaymentRoute = require('./routes/stripePayment-routes');
const branchOwnerBusinessRoute = require('./routes/Branch Owner/business-routes');
const branchOwnerBranchRoute = require('./routes/Branch Owner/branch-routes');
const branchOwnerSalespersonRoute = require('./routes/Branch Owner/salesperson-routes');
const branchOwnerProductRoute = require('./routes/Branch Owner/product-routes');
const customerCartRoute = require('./routes/Customer/cart-routes');
const customerProductsRoute = require('./routes/Customer/customerProduct-routes')
const cors = require('cors');

const app = express();
app.use(cors());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST',
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use(authRoute);
app.use(subscriptionRoute);
app.use(planStripePaymentRoute);
app.use(branchOwnerBusinessRoute);
app.use(branchOwnerBranchRoute);
app.use('/branchOwner',branchOwnerSalespersonRoute);
app.use('/branchOwner',branchOwnerProductRoute);
app.use('/customer',customerCartRoute);
app.use('/customer',customerProductsRoute);



db.connectToDatabase()
.then(function(){
    app.listen(3000)
})
.catch(function(error){
    console.log('Failed to Connect to the Database')
    console.log(error);
})




