const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')
const checkApiKey = require('../middleware/checkApiKey');


// Suggestion API
router.get('/order-status/:orderId', checkApiKey, paymentController.getOrderStatus);
router.post('/create-transaction', checkApiKey, paymentController.createTransaction);
router.post('/finish_payment', checkApiKey, paymentController.paymentFinish);
router.post('/finish', checkApiKey, paymentController.paymentFinish);


module.exports = router;
