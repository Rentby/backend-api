const { redisClientSearch, redisClientDatabase } = require('../config/redisConfig'); // Import file konfigurasi

  
module.exports.searchBar = async (req, res) => {
    const clientSearch = await redisClientSearch();

    const { query, limit } = req.query;
    if (!query || !limit) {
      return res.status(400).send('Missing required query (query, limit)');
    }
  
    try {
        const results = await clientSearch.ft.search('idx:product', `${query}*`, {
            SORTBY: "$.length",
            SORTASC: true,
            LIMIT: { from: 0, size: parseInt(limit) } 
        });
        
        const filteredResults = results.documents.map(doc => {
            const { length, ...rest } = doc.value;
            return rest;
        })

        res.status(200).json(filteredResults);
    } catch (err) {
      console.error('Error searching items: ', err);
      res.status(500).send('Internal Server Error');
    }
};

module.exports.getSearch = async (req, res) => {
    const clientData = await redisClientDatabase();
    
    const { query } = req.query;
    let { limit = 5, offset = 0 } = req.query;

    if (!query || !limit || !offset) {
        return res.status(400).send('Missing required query (query, limit, offset)');
    }

    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);
    if (isNaN(limit) || isNaN(offset)) {
        return res.status(400).send('Limit and offset must be valid numbers');
    }

    try {
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
        
        const hasMore = results.total > offset + limit;

        res.status(200).json({ 
            results: filteredResults,
            hasMore,
            nextOffset: offset + limit
    });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.searchByCategory = async (req, res) => {
    const clientData = await redisClientDatabase();
    
    const { category } = req.query;
    let { limit = 5, offset = 0 } = req.query;

    if (!category || !limit || !offset) {
        return res.status(400).send('Missing required query (category, limit, offset)');
    }
    
    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);

    if (!['cosplay', 'hiking'].includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    try {
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
            nextOffset: offset + limit
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};