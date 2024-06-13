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
        return res.status(400).json({ error: 'Missing required fields' });
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

// Menambahkan user baru
module.exports.paymentFinish = async (req, res) => {
    try {
      const { orderId, status_code, transaction_status } = req.body;
      // Validasi data
      if (!orderId || !status_code || !transaction_status ) {
        return res.status(400).json({ error: 'Transaksi Gagal' });
      }
      const timeStamp = moment().format('MMMM DD, YYYY, h:mm:ss.SSS A');

      // Data disimpan ke firestore
      const paymentData = {
        orderId: orderId,
        status_code: status_code,
        transaction_status: transaction_status,
        createdAt: timeStamp
      };
  
      await db.collection('payment-data').doc(uid).set(paymentData);
  
      // Mengembalikan respons dengan ID dokumen yang baru dibuat
    //   res.status(201).json({ id: uid });
      res.send('<h1>Pembayaran Berhasil</h1>');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };