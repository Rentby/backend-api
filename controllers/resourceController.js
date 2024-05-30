const db = require('../config/firestore');
const { v4: uuidv4 } = require('uuid'); // Import UUID
const uid = uuidv4();

// Menambahkan user baru
module.exports.registerUser = async (req, res) => {
  try {
    const { name, phone_number, address, email } = req.body;
    // Validasi data
    if (!name || !phone_number || !address || !email) {
      return res.status(400).json({ error: 'Name, phone number, email and address are required' });
    }
    
    // Data disimpan ke firestore
    const userData = {
      name: name,
      phone_number: phone_number,
      address: address,
      email: email
    };

    await db.collection('users').doc(uid).set(userData);

    // Mengembalikan respons dengan ID dokumen yang baru dibuat
    res.status(201).json({ id: uid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan semua product list
module.exports.getProductList = async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.description;
      items.push({ id: doc.id, data: data });
    });
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan semua orderan product list
module.exports.getOrderProductList = async (req, res) => {
  try {
    const snapshot = await db.collection('order-product-list').get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan rating sesuai dengan product id
module.exports.getRatingByProductId = async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.collection("rating").where("product_id", "==", id).get()
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan detail dari user by email
module.exports.userDetail = async (req, res) => {
  try {
    const { email } = req.params;
    const snapshot = await db.collection("users").where("email", "==", email).get()
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan detail seller by id
module.exports.sellerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('sellers').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    const data = doc.data();
    delete data.seller_id;
    res.json({ id: doc.id, data: doc.data() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan detail products by id
module.exports.productDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    delete doc.user_id;
    res.json({ id: doc.id, data: doc.data() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan active order by id
module.exports.activeOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.collection("active-order").where("user_id", "==", id).get()
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, data: doc.data() });
    });
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// API Suggestion


// Menambahkan data product baru
module.exports.addProduct = async (req, res) => {
  try {
    const { product_name, description, rent_price, url_photo, seller_id } = req.body;
    // Validasi data
    if (!product_name || !description || !rent_price || !url_photo || !seller_id) {
      return res.status(400).json({ error: 'Name Product, description, rent price, url photo, and seller id are required' });
    }

    // Data disimpan ke firestore
    const productData = {
      product_name: product_name,
      description: description,
      rent_price: rent_price,
      url_photo: url_photo,
      seller_id: seller_id
    };

    await db.collection('products').doc(uid).set(productData);

    // Mengembalikan respons dengan ID dokumen yang baru dibuat
    res.status(201).json({ id: uid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Menambahkan data seller baru
module.exports.addSeller = async (req, res) => {
  try {
    const { name, phone_number, address, wa_number, product_amount } = req.body;
    // Validasi data
    if (!name || !phone_number || !address || !wa_number || !product_amount) {
      return res.status(400).json({ error: 'Name Product, phone number, address, wa number, and product amount are required' });
    }

    // Data disimpan ke firestore
    const sellerData = {
      name: name,
      phone_number: phone_number,
      address: address,
      wa_number: wa_number,
      product_amount: product_amount
    };

    // Save the document with UUID as the document ID
    await db.collection('sellers').doc(uid).set(sellerData);

    // Mengembalikan respons dengan ID dokumen yang baru dibuat
    res.status(201).json({ id: uid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};