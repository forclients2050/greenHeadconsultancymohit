const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    keywords: {
        type: String,
        required: true
    },
    image: {
        type: Buffer, // Store binary data
        required: false
    },
    imageType: {
        type: String, // Store MIME type (e.g., 'image/jpeg')
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('News', newsSchema);