const { redisClientSearch, redisClientDatabase } = require('../config/redisConfig'); // Import file konfigurasi

// Get data for Search Bar
module.exports.searchBar = async (req, res) => {
    try {
        const clientSearch = await redisClientSearch();
    
        const { query, limit } = req.query;
        if (!query || !limit) {
          return res.status(400).send('Missing required query (query, limit)');
        }
      
        const results = await clientSearch.ft.search('idx:product', `${query}*`, {
            SORTBY: "$.length",
            SORTASC: true,
            LIMIT: { from: 0, size: parseInt(limit) } 
        });
        
        const filteredResults = results.documents.map(doc => {
            const { length, ...rest } = doc.value;
            return rest;
        })

        clientSearch.disconnect()
        res.status(200).json(filteredResults);
    } catch (err) {
      console.error('Error searching items: ', err);
      res.status(500).send('Internal Server Error');
    }
};

// Get data after search
module.exports.getSearch = async (req, res) => { 
    try {
        const clientData = await redisClientDatabase();
        
        const { query } = req.query;
        let { page = 1 } = req.query;
    
        if (!query || !page) {
            return res.status(400).send('Missing required query (query, page)');
        }
    
        limit = parseInt(30, 10);
        page = parseInt(page, 10);

        if (isNaN(limit) || isNaN(page) || page < 1) {
            return res.status(400).send('Invalid limit or page number');
        }

        const offset = (page - 1) * limit;

        const results = await clientData.ft.search('idx:product-data', `${query}*`, {
            SORTBY: "$.product_name",
            SORTASC: true,
            LIMIT: {
                from: offset,
                size: limit
            }
        });

        const filteredResults = results.documents.map(doc => {
            const { cosplay, hiking, description, seller_id, location, booked, rent_price, ...rest } = doc.value;
            const parsedRentPrice = parseInt(rent_price.toString().replace(/,/g, ''), 10);
            
            return {
                ...rest,
                rent_price: isNaN(parsedRentPrice) ? 0 : parsedRentPrice 
            };
        });
        
        clientData.disconnect()
        const hasMore = results.total > offset + limit;

        res.status(200).json({ 
            results: filteredResults,
            hasMore,
            nextPage: hasMore ? page + 1 : null
        });

        // res.status(200).json(filteredResults);

        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get search by category
module.exports.searchByCategory = async (req, res) => {  
    try {
        const clientData = await redisClientDatabase();
        
        const { category } = req.query;
        let { page = 1 } = req.query;
    
        if (!category || !page) {
            return res.status(400).send('Missing required query (category, page)');
        }
        
        limit = parseInt(30, 10);
        page = parseInt(page, 10);

        if (isNaN(limit) || isNaN(page) || page < 1) {
            return res.status(400).send('Invalid limit or page number');
        }
        
        const offset = (page - 1) * limit;
    
        if (!['cosplay', 'hiking'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const results = await clientData.ft.search('idx:product-data', `${category}*`, {
            SORTBY: "$."+category,
            SORTASC: true,
            LIMIT: {
                from: offset,
                size: limit
            }
        });

        const filteredResults = results.documents.map(doc => {
            const { cosplay, hiking, description, seller_id, location, booked, rent_price, ...rest } = doc.value;
            const parsedRentPrice = parseInt(rent_price.toString().replace(/,/g, ''), 10);
            
            return {
                ...rest,
                rent_price: isNaN(parsedRentPrice) ? 0 : parsedRentPrice 
            };
        });
       
        const hasMore = results.total > offset + limit;

        res.status(200).json({ 
            results: filteredResults,
            hasMore,
            nextPage: hasMore ? page + 1 : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
