const express = require('express');
const router = express.Router();
const machineLearningController = require('../controllers/machineLearningController')
const checkApiKey = require('../middleware/checkApiKey');

// Machine Learning API
router.get('/search', checkApiKey, machineLearningController.getSearch);
router.get('/search-bar', checkApiKey, machineLearningController.searchBar);
router.get('/search-category', checkApiKey, machineLearningController.searchByCategory);

module.exports = router;
