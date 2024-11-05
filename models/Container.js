const mongoose = require('mongoose');

const containerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        default: 'stopped'
    },
    port: {
        type: Number,
    },
    dockerImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DockerImage',
        required: true
    },
    containerId: { 
        type: String,
        required: true
    }

});

module.exports = mongoose.model('Container', containerSchema);
