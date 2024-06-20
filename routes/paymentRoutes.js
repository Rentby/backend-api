const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')
const checkApiKey = require('../middleware/checkApiKey');


// Payment API
router.post('/order', checkApiKey, paymentController.createTransaction);
router.get('/order-midtrans/:order_id', checkApiKey, paymentController.getOrderFromMidtrans);



module.exports = router;
