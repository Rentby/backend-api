const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')
const checkApiKey = require('../middleware/checkApiKey');


// Payment API
router.post('/create-transaction', checkApiKey, paymentController.createTransaction);
router.post('/order', checkApiKey, paymentController.postOrder);



module.exports = router;
