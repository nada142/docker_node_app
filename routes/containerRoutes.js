const express = require('express');
const router = express.Router();
const Docker = require('dockerode');

const containerController = require('../controllers/containerController');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

router.post('/containers', containerController.createContainer);

router.post('/containers/:id/restart', containerController.startContainer);
router.post('/containers/:id/stop', containerController.stopContainer);
router.delete('/containers/:id', containerController.deleteContainer);
router.get('/containers/:id/status', containerController.getStatus);
router.get('/containers', containerController.listContainers);


router.get('/count/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json({ count: containers.length });
    } catch (error) {
        console.error('Error fetching container count:', error);
        res.status(500).json({ error: 'Error fetching container count' });
    }
});


module.exports = router;
