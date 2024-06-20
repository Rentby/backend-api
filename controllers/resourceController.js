const db = require('../config/firestore');
const { v4: uuidv4 } = require('uuid'); // Import UUID
const uid = uuidv4();
const axios = require('axios');
const { Timestamp } = require('@google-cloud/firestore');

const productDB = "products"
const ratingDB = "rating"
const userDB = "users"
const sellerDB = "sellers"
const orderProductListDB = "order-product-list"

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

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

    const querySnapshot = await db.collection(userDB).where("email", "==", email).get();
    
    let userDetail = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();

      if (data) {
        userDetail.push({
          address: data.address,
          name: data.name,
          phone_number: data.phone_number,
          email: data.email,
          user_id: doc.id
        });
      }
    });

    if (userDetail.length === 0) {
      return res.status(404).json({ error: 'There is no user with that email' });
    }

    res.status(200).json(userDetail[0]);
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
  const collectionsToCheck = ['order-status-1', 'order-status-2', 'order-status-3', 'order-status-4', 'order-status-5', 'order-status-6'];
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required params (user_id)' });
    }
    
    let dataProduct = [];

    for (const collectionName of collectionsToCheck) {
      const snapshot = await db.collection(collectionName).where("user_id", "==", user_id).get();
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          dataProduct.push(doc.data());
        });
      }
    }

    if (dataProduct.length === 0) {
      return res.status(404).json({ error: 'There is no active order for this user' });
    }

    let items = [];
    dataProduct.forEach(data => {
      items.push({ 
        order_id: data.order_id,
        rent_start: data.rent_start,
        rent_end: data.rent_end,
        order_total: data.order_total,
        status: data.status,
        product_name: data.product_name,
        image_url: data.image_url
      });
    });

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

// Get the product by seller id with pagination
module.exports.getProductBySellerId = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const { page = 1 } = req.query;

    if (!seller_id || !page) {
      return res.status(400).json({ error: 'Missing required params (seller_id)' });
    }

    const pageSize = parseInt(30, 10);
    const offset = (parseInt(page, 10) - 1) * pageSize;

    let snapshot = await db.collection(productDB).where("seller_id", "==", seller_id)
      .offset(offset)
      .limit(pageSize)
      .get();

    const products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.cosplay;
      delete data.hiking;
      products.push(data);
    });

    if (products.length == 0) {
      return res.status(404).json({ error: 'There is no product in this seller' });
    }

    const totalSnapshot = await db.collection(productDB).where("seller_id", "==", seller_id).get();
    const totalItems = totalSnapshot.size;
    const totalPages = Math.ceil(totalItems / pageSize);

    res.status(200).json({
      products,
      totalItems,
      totalPages,
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get order detail by order_id
module.exports.getOrder = async (req, res) => {
  const collectionsToCheck = ['order-status-1', 'order-status-2', 'order-status-3', 'order-status-4', 'order-status-5', 'order-status-6'];
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ error: 'Missing required params (order_id)' });
    }

    const url = `https://api.sandbox.midtrans.com/v2/${order_id}/status`;
    if (!order_id ) {
        return res.status(400).json({ error: 'Missing required fields (order_id)' });
    }

    const midtrans = await axios.get(url, {
        headers: {
            'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
            'Content-Type': 'application/json'
        }
    });

    const midtransData = midtrans.data

    let dataProduct = null;
    let foundInCollection = null;

    for (const collectionName of collectionsToCheck) {
      const doc = await db.collection(collectionName).doc(order_id).get();
      if (doc.exists) {
        dataProduct = doc.data();
        foundInCollection = collectionName; 
        break; 
      }
    }

    if(foundInCollection === "order-status-1" && dataProduct.status === "1" && midtransData.transaction_status === "settlement"){
      const docOrder = db.collection("order-status-1").doc(order_id);
      await docOrder.delete()

      const activeProductRef = db.collection('order-status-2').doc(order_id);
      dataProduct.status = "2"
      dataProduct.payment_method = midtransData.payment_type
      await activeProductRef.set(dataProduct)
    }

    if (!dataProduct) {
      return res.status(404).json({ error: 'Order_id not found' });
    }

    const firestoreTimestamp = new Timestamp(dataProduct.rent_end._seconds, 0);
    const dataDate = firestoreTimestamp.toDate();
    const currentDate = new Date();

    if (dataProduct.status === "3" && dataDate < currentDate) {
      const docOrder = db.collection('order-status-3').doc(order_id);
      await docOrder.delete()

      const activeProductRef = db.collection('order-status-4').doc(order_id);
      dataProduct.status = "4"
      await activeProductRef.set(dataProduct)
    } 
  
    if (dataProduct.status == "4") {
      const docOrder = db.collection("order-status-4").doc(order_id);
      const currentTimestamp = Timestamp.now();
      const differenceInMilliseconds = currentTimestamp.toMillis() - dataProduct.rent_end.toMillis();
      const differenceInDays = Math.ceil(differenceInMilliseconds / (1000 * 60 * 60 * 24));
      dataProduct.late_duration = differenceInDays
      dataProduct.late_charge = differenceInDays * dataProduct.rent_price

      await docOrder.set(dataProduct)
    }

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

// Post receive product
module.exports.postReceiveProduct = async (req, res) => {
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ error: 'Missing required params (order_id)' });
    }

    const orderStatus2 = await db.collection("order-status-2").doc(order_id).get();

    if (!orderStatus2.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let dataOrder = orderStatus2.data();
    dataOrder.status = "3";
    dataOrder.pickup_time = Timestamp.now()

    const orderStatus3 = db.collection('order-status-3').doc(order_id);
    await orderStatus3.set(dataOrder);
    
    const deleteOrderStatus2 = db.collection("order-status-2").doc(order_id);
    await deleteOrderStatus2.delete();
    
    res.status(200).json({ success: "Product status changed to 3" });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Post receive product
module.exports.postCancelOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ error: 'Missing required params (order_id)' });
    }

    const orderStatus1 = await db.collection("order-status-1").doc(order_id).get();

    if (!orderStatus1.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let dataOrder = orderStatus1.data();
    dataOrder.status = "6";
    

    const orderStatus6 = db.collection('order-status-6').doc(order_id);
    await orderStatus6.set(dataOrder);
    
    const deleteOrderStatus1 = db.collection("order-status-1").doc(order_id);
    await deleteOrderStatus1.delete();
    
    const deleteBookedDate = db.collection("booked-date").doc(order_id);
    await deleteBookedDate.delete();

    res.status(200).json({ success: "Product status changed to 6" });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Post receive product
module.exports.postCompletedOrder = async (req, res) => {
  const collectionsToCheck = ['order-status-3', 'order-status-4'];
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ error: 'Missing required params (order_id)' });
    }

    let dataProduct = null;
    let foundInCollection = '';

    for (const collectionName of collectionsToCheck) {
      const doc = await db.collection(collectionName).doc(order_id).get();
      if (doc.exists) {
        dataProduct = doc.data();
        foundInCollection = collectionName; 
        break; 
      }
    }

    if (dataProduct == null) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const docOrder = db.collection(foundInCollection).doc(order_id);
    await docOrder.delete()

    const activeProductRef = db.collection('order-status-5').doc(order_id);
    dataProduct.status = "5"
    dataProduct.return_time = Timestamp.now()

    await activeProductRef.set(dataProduct)
    
    res.status(200).json({ success: "Product status changed to 5" });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update a user
module.exports.updateUser = async (req, res) => {
  try {
    const { name, phone_number, address, email } = req.body;
    if (!name || !phone_number || !address || !email) {
      return res.status(400).json({ error: 'Missing required params (name, phone_number, address, email)' });
    }

    const checkEmail = await db.collection(userDB).where('email', '==', email).get();
    
    const items = [];
    checkEmail.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });
    
    if (items.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userData = {
      name,
      phone_number,
      address,
      email
    };

    await db.collection(userDB).doc(items[0].id).set(userData);
    res.status(200).json({success: "Success updated data "+email });
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
