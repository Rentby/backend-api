require('dotenv').config(); 

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const resourceRoutes = require('./routes/resourceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const machineLearningRoutes = require('./routes/machineLearningRoutes');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // In 5 Minutes
  max: 1000, // Max 1000 Response
});

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(logger);
app.use(express.json());
app.use(limiter);

// Resource Routes
app.use('/api', resourceRoutes);

// Payment Routes
app.use('/api/payment', paymentRoutes)

// Machine Learning Routes
app.use('/api', machineLearningRoutes)

// Base URL Response
app.get('/', (req, res) => {
  res.send('<h1>Response Success</h1>');
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
