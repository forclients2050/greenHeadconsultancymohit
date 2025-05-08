const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    category: {
      type: String,
      required: true,
        
    },
    subcategory: {
        type: String,
        trim: true,
        default: '', // Ensure default is an empty string if not provided
    },
    seoKeywords: {
        type: [String],
        default: [],
    },
    shortDescription: {
        type: String,
        default: '',
    },
    image: {
        type: Buffer,
        default: null,
    },
    imageType: {
        type: String,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ServiceMangement', serviceSchema);