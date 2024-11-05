const mongoose = require('mongoose');

const dockerImageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Image name is required']
    },
    imageId: {
        type: String,
        required: [true, 'Image ID is required']
    },
    dateOfCreation: {
        type: Date,
        default: Date()
    },
    dockerfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dockerfile',
        required: true
        
    }
   

});

module.exports = mongoose.model('Image', dockerImageSchema);
