const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const machineLearningController = require('../controllers/machineLearningController')
const checkApiKey = require('../middleware/checkApiKey');

// Main API
router.post('/user-register', checkApiKey, resourceController.registerUser);
router.get('/user-detail/:email', checkApiKey, resourceController.userDetail);
router.get('/seller/:id', checkApiKey, resourceController.sellerDetail);
router.get('/product/:id', checkApiKey, resourceController.productDetail);
router.get('/order-product-list/', checkApiKey, resourceController.getOrderProductList);
router.get('/rating/:id', checkApiKey, resourceController.getRatingByProductId);
router.get('/active-order/:id', checkApiKey, resourceController.activeOrderById);
router.post('/estimate-order', checkApiKey, resourceController.postOrderEstimate);

// Suggestion API
router.post('/product', checkApiKey, resourceController.addProduct);
router.post('/seller', checkApiKey, resourceController.addSeller);
router.get('/seller-product/:id', checkApiKey, resourceController.getAllSellerProduct);
router.get('/product-rating/:rating', checkApiKey, resourceController.getProductByRating);

// ML API
router.get('/search', checkApiKey, machineLearningController.afterSearch);
router.get('/search-bar', checkApiKey, machineLearningController.searchBar);
router.get('/search-category', checkApiKey, machineLearningController.searchByCategory);


module.exports = router;
