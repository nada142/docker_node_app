const express = require('express');
const router = express.Router();
const DockerFile = require('../models/dockerfilee'); 
const DockerImage = require('../models/Image'); 
const DockerContainer = require('../models/Container');
const Docker = require('dockerode');
const docker = new Docker();
router.get('/api/stats', async (req, res) => {
    console.log('Request received for /api/stats'); 
    try {
        const containers = await docker.listContainers({ all: true });
        
        // Count containers based on their status
        const statusCounts = containers.reduce((counts, container) => {
            if (container.State === 'running') {
                counts.running++;
            } else if (container.State === 'exited') {
                counts.exited++;
            }
            return counts;
        }, { running: 0, exited: 0 });

        res.json(statusCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
