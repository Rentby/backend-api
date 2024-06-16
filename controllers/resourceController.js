const db = require('../config/firestore');
const { v4: uuidv4 } = require('uuid'); // Import UUID
const uid = uuidv4();

const productDB = "products-final"
const ratingDB = "rating"
const userDB = "users"
const sellerDB = "seller"
const orderProductListDB = "order-product-list"

// Add new user
module.exports.postRegisterUser = async (req, res) => {
  try {
    const { name, phone_number, address, email } = req.body;
    if (!name || !phone_number || !address || !email) {
      return res.status(400).json({ error: 'Missing required params (name, phone_number, address, email)' });
    }

    const checkEmail = await db.collection(userDB).where('email', '==', email).get()
    
    const items = [];
    checkEmail.forEach(doc => {
      items.push(doc.data())
    })
    
    if(items.length !== 0){
      return res.status(400).json({ error: 'Email has been registered, please use another email' });
    }

    const userData = {
      name: name,
      phone_number: phone_number,
      address: address,
      email: email
    };

    await db.collection(userDB).doc(uid).set(userData);
    res.status(201).json({ id: uid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all product list orders
module.exports.getOrderProductList = async (req, res) => {
  try {
    const snapshot = await db.collection(orderProductListDB).get();
    const items = [];
    snapshot.forEach(doc => {
      items.push(doc.data());
    });

    if (items.length == 0) {
      return res.status(404).json({ error: 'There is no product in order list' });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get a rating according to the product_id
module.exports.getRatingByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) {
      return res.status(400).json({ error: 'Missing required params (product_id)' });
    }
    
    const snapshot = await db.collection(ratingDB).where("product_id", "==", product_id).get()
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });

    if (items.length == 0) {
      return res.status(404).json({ error: 'There is no rating in this product' });
    }

    res.status(200).json(items[0].data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get details from user by email
module.exports.getUserDetail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'Missing required params (email)' });
    }

    const querySnapshot = await db.collection(userDB).where("email", "==", email).get()
    
    let items = [];
    querySnapshot.forEach(doc => {
      items = {id: doc.id, data: doc.data()};
    });

    if (items.length == 0) {
      return res.status(404).json({ error: 'There is no user with that email' });
    }

    res.status(200).json(items.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get seller details by seller_id
module.exports.getSellerDetail = async (req, res) => {
  try {
    const { seller_id } = req.params;
    if (!seller_id) {
      return res.status(400).json({ error: 'Missing required params (seller_id)' });
    }
    
    const doc = await db.collection(sellerDB).doc(seller_id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    const data = doc.data();
    delete data.seller_id;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get product details by product_id
module.exports.getProductDetail = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) {
      return res.status(400).json({ error: 'Missing required params (product_id)' });
    }

    const doc = await db.collection(productDB).doc(product_id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const data = doc.data();
    delete data.cosplay;
    delete data.hiking;

    if (data.rent_price) {
      const parsedRentPrice = parseInt(data.rent_price.toString().replace(/,/g, ''), 10);
      data.rent_price = isNaN(parsedRentPrice) ? 0 : parsedRentPrice;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get active orders by user_id
module.exports.getActiveOrderById = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required params (user_id)' });
    }

    const snapshot = await db.collection("active-order").where("user_id", "==", user_id).get()
    
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });

    if (items.length == 0) {
      return res.status(404).json({ error: 'There is no active order in this user' });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Post Order Estimate
module.exports.postOrderEstimate = async (req, res) => {
  try {
    const { product_id, rent_start, rent_end, rent_length } = req.body;
    if (!product_id || !rent_start || !rent_end || !rent_length) {
      return res.status(400).json({ error: 'Missing required fields (product_id, rent_start, rent_end, rent_length)' });
    }

    const docRef = db.collection(productDB).doc(product_id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let productData = doc.data();

    const calculateRent = (rent_price, rent_length) => {
      return rent_price * rent_length;
    };

    if (productData.rent_price) {
      const parsedRentPrice = parseInt(productData.rent_price.toString().replace(/,/g, ''), 10);
      productData.rent_price = isNaN(parsedRentPrice) ? 0 : parsedRentPrice; 
    }

    const total_rent = calculateRent(productData.rent_price, rent_length);

    const orderEstimate = {
      product_id: product_id,
      product_name: productData.product_name,
      rent_price: productData.rent_price,
      rent_start: rent_start,
      rent_end: rent_end,
      rent_total: total_rent,
      service_fee: 1000,
      deposit: parseInt((total_rent * 0.1).toString().replace(/,/g, ''), 10),
      order_total: parseInt((total_rent + 1000 + productData.rent_price * 0.1).toString().replace(/,/g, ''), 10),
    };

    res.status(200).json(orderEstimate);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get the product by seller id
module.exports.getProductBySellerId = async (req, res) => {
  try {
    const { seller_id } = req.params;
    if (!seller_id) {
      return res.status(400).json({ error: 'Missing required params (seller_id)' });
    }

    const snapshot = await db.collection(productDB).where("seller_id", "==", seller_id).get()
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.cosplay;
      delete data.hiking;
      items.push(data);
    });

    if (items.length == 0) {
      return res.status(404).json({ error: 'There is no product in this seller' });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get order detail by order_id
module.exports.getOrder = async (req, res) => {
  try {
      const { order_id } = req.params;
      if (!order_id ) {
          return res.status(400).json({ error: 'Missing required params (order_id)' });
      }

      const doc = await db.collection('payment-data').doc(order_id).get();
      if (!doc.exists) {
          return res.status(404).json({ error: 'Order_id not found' });
      }
      const dataProduct = doc.data();
  
      res.status(200).json(dataProduct);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get booked date by product_id
module.exports.getBookedDate = async (req, res) => {
  try {
      const { product_id } = req.params;
      if (!product_id ) {
          return res.status(400).json({ error: 'Missing required params (product_id)' });
      }

      const snapshot = await db.collection(orderProductListDB).where("product_id", "==", product_id).get()
      
      const items = [];
      snapshot.forEach(doc => {
        items.push(doc.data());
      });
      
      if (items.length == 0) {
        return res.status(404).json({ error: 'There is no booked data in this product' });
      }

      res.status(200).json(items);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};



// API Suggestion

// Added new product data
module.exports.addProduct = async (req, res) => {
  try {
    const { product_name, description, rent_price, url_photo, seller_id } = req.body;
    if (!product_name || !description || !rent_price || !url_photo || !seller_id) {
      return res.status(400).json({ error: 'Missing required fields (product_name, description, rent_price, url_photo, seller_id)' });
    }

    const productData = {
      product_name: product_name,
      description: description,
      rent_price: rent_price,
      url_photo: url_photo,
      seller_id: seller_id
    };

    await db.collection(productDB).doc(uid).set(productData);
    res.status(201).json({ id: uid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Added new seller data
module.exports.addSeller = async (req, res) => {
  try {
    const { name, phone_number, address, wa_number, product_amount } = req.body;
    if (!name || !phone_number || !address || !wa_number || !product_amount) {
      return res.status(400).json({ error: 'Missing required fields (name, phone_number, address, wa_number, product_amount)' });
    }

    const sellerData = {
      name: name,
      phone_number: phone_number,
      address: address,
      wa_number: wa_number,
      product_amount: product_amount
    };

    await db.collection(sellerDB).doc(uid).set(sellerData);
    res.status(201).json({ id: uid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get Product by Rating
module.exports.getProductByRating = async (req, res) => {
  try {
    const { rating } = req.params;
    if (!rating) {
      return res.status(400).json({ error: 'Missing required params (rating)' });
    }

    const snapshot = await db.collection(productDB).where("rating", "==", rating+'f').get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'There is no active order in this user' });
    }

    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.description;
      items.push(data);
    });
    res.status(200).json(items[0].data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};