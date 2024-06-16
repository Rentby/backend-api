const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const checkApiKey = require('../middleware/checkApiKey');

// Main API
router.post('/user', checkApiKey, resourceController.postRegisterUser);
router.get('/user/:email', checkApiKey, resourceController.getUserDetail);
router.get('/seller/:seller_id', checkApiKey, resourceController.getSellerDetail);
router.get('/product/:product_id', checkApiKey, resourceController.getProductDetail);
router.get('/order-product-list/', checkApiKey, resourceController.getOrderProductList);
router.get('/rating/:product_id', checkApiKey, resourceController.getRatingByProductId);
router.get('/active-order/:user_id', checkApiKey, resourceController.getActiveOrderById);
router.post('/estimate-order', checkApiKey, resourceController.postOrderEstimate);
router.get('/product-seller/:seller_id', checkApiKey, resourceController.getProductBySellerId);
router.get('/order/:order_id', checkApiKey, resourceController.getOrder);
router.get('/booked-date/:product_id', checkApiKey, resourceController.getBookedDate);

// Suggestion API
router.post('/product', checkApiKey, resourceController.addProduct);
router.post('/seller', checkApiKey, resourceController.addSeller);
router.get('/product-rating/:rating', checkApiKey, resourceController.getProductByRating);

module.exports = router;
