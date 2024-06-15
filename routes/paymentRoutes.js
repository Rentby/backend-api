const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')
const checkApiKey = require('../middleware/checkApiKey');


// Payment API
router.get('/order-status/:orderId', checkApiKey, paymentController.getOrderStatus);
router.post('/create-transaction', checkApiKey, paymentController.createTransaction);
router.post('/order', checkApiKey, paymentController.postOrder);
router.get('/order/:id', checkApiKey, paymentController.getOrder);
router.get('/booked-date/:id', checkApiKey, paymentController.getBookedDate);

module.exports = router;
