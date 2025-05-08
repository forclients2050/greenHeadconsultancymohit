
const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String,  },
  isDeleted: { type: Boolean, default: false }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, },
  subcategories: [subcategorySchema],
  token:{type:String},
  isDeleted: { type: Boolean, default: false }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
