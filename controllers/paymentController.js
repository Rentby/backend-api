const db = require('../config/firestore');
const { v4: uuidv4 } = require('uuid'); // Import UUID
const uid = uuidv4();
const shortid = require('shortid');
const axios = require('axios');
const sUid = shortid.generate();
const midtransClient = require('midtrans-client');
const moment = require('moment');

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: MIDTRANS_SERVER_KEY
});

module.exports.getOrderStatus = async (req, res) => {

    const { orderId } = req.params;
    const url = `https://api.sandbox.midtrans.com/v2/${orderId}/status`;
    if (!orderId) {
        return res.status(400).json({ error: 'Missing required params (orderId)' });
    }
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(error.response ? error.response.status : 500).json({
            message: 'Error fetching order status',
            error: error.message
        });
    }
};

module.exports.createTransaction = async (req, res) => {
    const {name, price, product, email} = req.body
    if (!name || !price || !product || !email) {
        return res.status(400).json({ error: 'Missing required fields (name, price, product, email)' });
    }
    const parameter = {
        transaction_details: {
            order_id: uid,
            gross_amount: price
        },
        credit_card: {
            secure: true
        },
        customer_details: {
            first_name: name,
            last_name: "",
            email: email,
            phone: "82313123123"
        },
        item_details: [
            {
                id: "product - " + sUid,
                name: product,
                description: product,
                quantity: 1,
                price: price
            }
        ],
    };
   
    snap.createTransaction(parameter)
        .then((transaction) => {
        res.json({ token: transaction.token, orderId: parameter.transaction_details.order_id });
    });

};

// Menambahkan order baru
module.exports.postOrder = async (req, res) => {
    const { order_id, product_id, user_id, rent_start, rent_end } = req.body;
    const url = `https://api.sandbox.midtrans.com/v2/${order_id}/status`;
    if (!order_id || !product_id || !user_id || !rent_start || !rent_end) {
        return res.status(400).json({ error: 'Missing required fields (order_id, product_id, user_id, rent_start, rent_end)' });
    }

    try {
        const midtransStatus = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        const doc = await db.collection('products').doc(product_id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const dataProduct = doc.data();
        delete dataProduct.cosplay;
        delete dataProduct.hiking;
        const sellerId = dataProduct.seller_id

        const docSeller = await db.collection('seller').doc(sellerId).get();
        if (!docSeller.exists) {
            return res.status(404).json({ error: 'Seller not found' });
        }
        const dataSeller = docSeller.data();

        const checkStatusPayment = (status) => {
            let finalStatus;
            if (status === "pending") {
              finalStatus = 1;
            } else if (status === "settlement") {
              finalStatus = 2;
            } else if (status === "cancel") {
              finalStatus = 7;
            }
            return finalStatus;
          };
        const mid = midtransStatus.data

        // Store data to firestore
        const paymentData = {
            status: checkStatusPayment(mid.transaction_status),
            order_time: mid.transaction_time,
            order_id: order_id,
            user_id: user_id,
            pickup_time: "",
            return_time: "",
            snap_token: mid.signature_key, //snap token ?
            payment_method: mid.payment_type,
            seller_id: dataProduct.seller_id,
            seller_name: dataSeller.name,
            pickup_location: "",
            product_name: dataProduct.product_name,
            image_url: dataProduct.url_photo,
            rent_start: rent_start,
            rent_end: rent_end,
            rent_duration: "3 Hari",
            rent_price: parseInt(dataProduct.rent_price),
            rent_total: parseInt(dataProduct.rent_price) * 3,
            service_fee: 1000,
            deposit: parseInt(dataProduct.rent_price) * 0.1,
            order_total: parseInt(mid.gross_amount),
            isRated: "",
            lateDuration: "",
            lateChange: "",
        };
  
        await db.collection('payment-data').doc(order_id).set(paymentData);
        res.status(201).json({ id: order_id });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };

module.exports.getOrder = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id ) {
            return res.status(400).json({ error: 'Missing required params (id)' });
        }

        const doc = await db.collection('payment-data').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const dataProduct = doc.data();
    
        res.status(201).json(dataProduct);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };