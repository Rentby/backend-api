const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')
const checkApiKey = require('../middleware/checkApiKey');


// Suggestion API
router.get('/order-status/:orderId', checkApiKey, paymentController.getOrderStatus);
router.post('/create-transaction', checkApiKey, paymentController.createTransaction);

module.exports = router;
