const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const checkApiKey = require('../middleware/checkApiKey');

// Main API
router.post('/user-register', checkApiKey, resourceController.postRegisterUser);
router.get('/user-detail/:email', checkApiKey, resourceController.getUserDetail);
router.get('/seller/:id', checkApiKey, resourceController.getSellerDetail);
router.get('/product/:id', checkApiKey, resourceController.getProductDetail);
router.get('/order-product-list/', checkApiKey, resourceController.getOrderProductList);
router.get('/rating/:id', checkApiKey, resourceController.getRatingByProductId);
router.get('/active-order/:id', checkApiKey, resourceController.getActiveOrderById);
router.post('/estimate-order', checkApiKey, resourceController.postOrderEstimate);
router.get('/product-seller/:id', checkApiKey, resourceController.getProductBySellerId);

// Suggestion API
router.post('/product', checkApiKey, resourceController.addProduct);
router.post('/seller', checkApiKey, resourceController.addSeller);
router.get('/seller-product/:id', checkApiKey, resourceController.getAllSellerProduct);
router.get('/product-rating/:rating', checkApiKey, resourceController.getProductByRating);

module.exports = router;
