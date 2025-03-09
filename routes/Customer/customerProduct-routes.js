const express = require('express');
const customerProductController = require('../../controller/Customer/customerProducts-controller');
const router = express.Router();

router.get('/getCustomerProductbyId', customerProductController.getCustomerProductbyId);
router.get('/getProductsByCategory', customerProductController.getProductsByCategory);
router.get('/getProductsBySubcategoryAndType', customerProductController.getProductsBySubcategoryAndType);
router.get('/getSaleEventProducts', customerProductController.getSaleEventProducts)
router.get('/getSearchedProduct', customerProductController.searchProduct)

module.exports = router;