const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  salary: { type: Number, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true }
});

module.exports = mongoose.model('Resource', resourceSchema);
