require('dotenv').config(); 

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const resourceRoutes = require('./routes/resourceRoutes');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // Dalam 5 menit
  max: 100, // maksimal 100 permintaan
});

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(logger);
app.use(express.json());
app.use(limiter);

app.use('/api', resourceRoutes);
app.get('/', (req, res) => {
  res.send('<h1>Response Success</h1>');
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
