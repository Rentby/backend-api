const admin = require('firebase-admin');
const db = require('../config/firestore');
const { v4: uuidv4 } = require('uuid'); // Import UUID
const uid = uuidv4();
const axios = require('axios');
const midtransClient = require('midtrans-client');
const { Timestamp } = require('@google-cloud/firestore');

const moment = require('moment-timezone');


const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: MIDTRANS_SERVER_KEY
});


const limitWords = (str, wordLimit) => {
    const words = str.split(' '); 
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...'; 
    }
    return str; 
}

function reformatDate(dateString) {
    const reformattedDate = dateString.replace(/([+-]\d{2}):(\d{2})$/, '$1$2');
    return reformattedDate;
}


function extractTimeZone(dateString) {
    const timeZonePattern = /(UTC[+-]\d+)/;
    const match = dateString.match(timeZonePattern);
    return match ? match[0] : null;
}
  
function calculateDaysDifference(startDateString, endDateString) {
    const startTimeZone = extractTimeZone(startDateString);
    const endTimeZone = extractTimeZone(endDateString);
  
    if (!startTimeZone || !endTimeZone) {
      throw new Error('Invalid date format or time zone');
    }
  
    const startDate = moment.tz(startDateString, 'MMMM D, YYYY at h:mm:ss A [UTC]Z', startTimeZone);
    const endDate = moment.tz(endDateString, 'MMMM D, YYYY at h:mm:ss A [UTC]Z', endTimeZone);
  
    const differenceInDays = endDate.diff(startDate, 'days');
  
    return differenceInDays;
}
  

// Create Transaction Token using Midtrans
module.exports.createTransaction = async (req, res) => {
    const {product_id, user_id, rent_start, rent_end} = req.body
    if (!product_id || !user_id || !rent_start || !rent_end) {
        return res.status(400).json({ error: 'Missing required fields (product_id, user_id, rent_start, rent_start)' });
    }

    const timeZone = 'Asia/Jakarta'; // Zona waktu Makassar
    const currentDate = moment().tz(timeZone);
    const timeStamp = currentDate.format('YYYY-MM-DD HH:mm:ss Z');

    const rent_length = calculateDaysDifference(rent_start, rent_end) + 1;

    const docProduct = await db.collection('products').doc(product_id).get();
    if (!docProduct.exists) {
        return res.status(404).json({ error: 'Product not found' });
    }
    const dataProduct = docProduct.data();
    delete dataProduct.hiking;
    let categoryProduct;

    if(parseInt(dataProduct.cosplay) === 1){
        categoryProduct = "cosplay"
    } else {
        categoryProduct = "hiking"
    }

    const docUser = await db.collection('users').doc(user_id).get();
    if (!docUser.exists) {
        return res.status(404).json({ error: 'User not found' });
    }
    const dataUser = docUser.data();

    const docSeller = await db.collection('sellers').doc(dataProduct.seller_id).get();
    if (!docUser.exists) {
        return res.status(404).json({ error: 'User not found' });
    }
    const dataSeller = docSeller.data();

    const parsedRentStart = moment.tz(rent_start, "MMMM D, YYYY at h:mm:ss A [UTC]Z", 'Asia/Makassar').toDate();
    const parsedRentEnd = moment.tz(rent_end, "MMMM D, YYYY at h:mm:ss A [UTC]Z", 'Asia/Makassar').toDate();

    if (!parsedRentStart || !parsedRentEnd) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    const parameter = {
        transaction_details: {
            order_id: uid,
            gross_amount: parseInt(dataProduct.rent_price) * rent_length,
        },
        credit_card: {
            secure: true
        },
        customer_details: {
            first_name: dataUser.name,
            last_name: "",
            email: dataUser.email,
            phone: dataUser.phone_number
        },
        item_details: [
            {
                id: dataProduct.product_id,
                name: limitWords(dataProduct.product_name, 6),
                price: parseInt(dataProduct.rent_price),
                quantity: rent_length,
                category: categoryProduct,
                merchant_name: dataSeller.name
            }
        ],
        custom_expiry: {
            order_time: reformatDate(timeStamp.toString()),
            expiry_duration: "60",
            unit: "minute"
        }
    };

    function checkDateInRange(rent_start_now, rent_end_now, rent_start_booked_seconds, rent_end_booked_seconds) {

        const rentStartNowDate = moment.tz(rent_start_now, "MMM D, YYYY [at] h:mm:ss A [UTC]Z", "UTC+8").toDate();
        const rentEndNowDate = moment.tz(rent_end_now, "MMM D, YYYY [at] h:mm:ss A [UTC]Z", "UTC+8").toDate();
        
        const rentStartDate = new Timestamp(rent_start_booked_seconds, 0).toDate();
        const rentEndDate = new Timestamp(rent_end_booked_seconds, 0).toDate();

        return (
            (rentStartNowDate >= rentStartDate && rentStartNowDate <= rentEndDate) ||
            (rentEndNowDate >= rentStartDate && rentEndNowDate <= rentEndDate) ||
            (rentStartNowDate <= rentStartDate && rentEndNowDate >= rentEndDate)
        );
    }

    let dataBooked = [];

    const snapshot = await db.collection("booked-date").where("product_id", "==", product_id).get();
    if (!snapshot.empty) {
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.rent_start && data.rent_end) {
                if (checkDateInRange(rent_start, rent_end, data.rent_start._seconds, data.rent_end._seconds)) {
                    dataBooked.push(data);
                }
            }
        });
    }

    if (dataBooked.length !== 0) {
        return res.status(400).json({ error: 'Select another date, the date is already selected' });
    }

    snap.createTransaction(parameter)
        .then(async (transaction) => {
            const newUid = uuidv4();
            const paymentData = {
                status: "1",
                order_time: timeStamp,
                order_id: newUid,
                user_id: user_id,
                pickup_time: "",
                return_time: "",
                snap_token: transaction.token, 
                payment_method: "",
                seller_id: dataProduct.seller_id,
                seller_name: dataSeller.name,
                pickup_location: dataSeller.address,
                product_name: dataProduct.product_name,
                image_url: dataProduct.url_photo,
                rent_start: admin.firestore.Timestamp.fromDate(parsedRentStart),
                rent_end: admin.firestore.Timestamp.fromDate(parsedRentEnd),
                rent_duration: rent_length+" Hari",
                rent_price: parseInt(dataProduct.rent_price),
                rent_total: parseInt(dataProduct.rent_price) * rent_length,
                service_fee: 1000,
                deposit: Math.round(parseInt(dataProduct.rent_price) * rent_length * 0.1),
                order_total: parseInt(parameter.transaction_details.gross_amount),
                isRated: "",
                late_duration: "",
                late_charge: "",
            };
            await db.collection('order-status-1').doc(newUid).set(paymentData);

            const bookedDate = {
                order_id: newUid,
                product_id: product_id,
                rent_start: admin.firestore.Timestamp.fromDate(parsedRentStart),
                rent_end: admin.firestore.Timestamp.fromDate(parsedRentEnd),
            }

            await db.collection('booked-date').doc(newUid).set(bookedDate);
            
        res.status(201).json({
            order_id: paymentData.order_id,
        });
    });
};

// Get order detail by order_id in midtrans
module.exports.getOrderFromMidtrans = async (req, res) => {
    try {
        const { order_id } = req.params;
        const url = `https://api.sandbox.midtrans.com/v2/${order_id}/status`;
        if (!order_id ) {
            return res.status(400).json({ error: 'Missing required fields (order_id)' });
        }

        const midtransStatus = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ data: midtransStatus.data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
