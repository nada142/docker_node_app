const express = require('express');
const router = express.Router();
const Docker = require('dockerode');

const dockerImageController = require('../controllers/dockerImageController');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Routes
router.get('/images', dockerImageController.listImages); 

router.post('/images', dockerImageController.pullImage);
router.post('/images/:name/push', dockerImageController.pushImage);
router.delete('/images/:id', dockerImageController.deleteImage);
router.post('/images/:id/run', dockerImageController.runImage); 
router.get('/images/:id/status', dockerImageController.getStatus);
router.get('/images/:id', dockerImageController.getImageById);

router.get('/images/:imageId/dockerfilees/:dockerfileId', dockerImageController.getDockerFile);



router.get('/count/images', async (req, res) => {
    try {
        const images = await docker.listImages();
        res.json({ count: images.length });
    } catch (error) {
        console.error('Error fetching image count:', error);
        res.status(500).json({ error: 'Error fetching image count' });
    }
});

module.exports = router;
