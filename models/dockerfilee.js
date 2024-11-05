const mongoose = require('mongoose');

const dockerfileSchema = new mongoose.Schema({
    lines: {
        type: [String], 
        required: [true, 'Lines are required']
    },
    name: {
        type: String,
    }

});

module.exports = mongoose.model('dockerfilee', dockerfileSchema);
