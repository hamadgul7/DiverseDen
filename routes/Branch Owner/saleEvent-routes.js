const express = require('express');
const saleEventController = require('../../controller/Branch Owner/saleEvent-controller');
const verifyToken = require('../../middleware/authMiddleware');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// const uploadDir = path.join(__dirname, "../../uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post('/createSaleEvent', verifyToken, upload.single("image"), saleEventController.createSaleEvent);
router.get('/viewSaleEvents', verifyToken, saleEventController.viewSaleEvents);
router.get('/viewAllSaleEvents', saleEventController.viewAllSaleEvents)
router.get('/viewSaleEventById', verifyToken, saleEventController.viewASaleEventById);
router.get('/viewSaleEventByIdWithProductDetails',  saleEventController.viewSaleEventByIdWithProductDetails)
router.post('/updateSaleEvent', verifyToken, saleEventController.updateSaleEvent);
router.post('/deleteSaleEvent', verifyToken, saleEventController.deleteSaleEvent)

module.exports = router;
