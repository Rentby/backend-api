const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const checkApiKey = require('../middleware/checkApiKey');
const validateResource = require('../middleware/validation');

// Main API
router.post('/user-register', checkApiKey, resourceController.registerUser);
router.get('/user-detail/:id', checkApiKey, resourceController.userDetail);
router.get('/product-list', checkApiKey, resourceController.getProductList);
router.get('/order-product-list/', checkApiKey, resourceController.getOrderProductList);
router.get('/rating/:id', checkApiKey, resourceController.getRatingByProductId);
router.get('/seller-detail/:id', checkApiKey, resourceController.sellerDetail);
router.get('/product-detail/:id', checkApiKey, resourceController.productDetail);
router.get('/active-order/:id', checkApiKey, resourceController.activeOrderById);

// Suggestion API
router.post('/product', checkApiKey, resourceController.addProduct);
router.post('/seller', checkApiKey, resourceController.addSeller);


module.exports = router;
