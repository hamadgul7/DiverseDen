const express = require('express');
const multer = require('multer');
const productController = require('../../controller/Branch Owner/product-controller');
const verifyToken = require('../../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// const uploadDir = path.join(__dirname, "../../uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

const storage = multer.diskStorage({
  // destination: (req, file, cb) => {
  //   cb(null, uploadDir);
  // },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get('/getProductById', verifyToken, productController.getProductbyId);
router.get('/viewBusinessProductsById',verifyToken, productController.viewBusinessProductsbyId); 
// router.get('/viewBranchProductsById', verifyToken, productController.viewBranchProductsById);
router.get('/viewBusinessProductsbyIdWithoutPagination', verifyToken, productController.viewBusinessProductsbyIdWithoutPagination)
router.post('/addProduct', verifyToken, upload.array("media", 10), productController.addProduct);
router.post('/updateProductById', verifyToken, upload.array("media", 10), productController.updateProductById);
router.post('/deleteProductById', verifyToken, productController.deleteProductById);
router.post('/deleteProductFromBranch',  productController.deleteProductFromBranch);

module.exports = router;