const mongoose = require('mongoose');


const adminsignupSchema = new mongoose.Schema({
  token: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  name: {
    type: String,
  },
  password: {
    type: String,
  },
 
  otpExpiresAt: {
    type: Date
  },
  otp: {
    type: String,
  },
 
  verified: {
    type: Boolean,
    default: false,
  }
});

const adminSignup = mongoose.model('AdminSignup', adminsignupSchema);

module.exports = adminSignup;
