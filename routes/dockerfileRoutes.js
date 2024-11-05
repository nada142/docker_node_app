const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/dockerController');
const Dockerfile = require('../models/dockerfilee'); 
const Docker = require('dockerode');


const docker = new Docker({ socketPath: '/var/run/docker.sock' });

router.post('/dockerfilees/:id/generate', dockerController.generateDockerfile);
router.post('/dockerfilees/build', dockerController.buildDockerImage);
router.post('/dockerfilees', dockerController.createDockerFile);
router.get('/dockerfilees', dockerController.getAllDockerFiles);
router.get('/dockerfilees/:id', dockerController.getDockerFileById);
router.put('/dockerfilees/:id', dockerController.updateDockerFile);
router.delete('/dockerfilees/:id', dockerController.deleteDockerFile);
router.post('/dockerfilees/:id/lines', dockerController.addLineToDockerFile);
router.delete('/dockerfilees/:id/lines/:lineIndex', dockerController.deleteLineFromDockerFile);
router.put('/dockerfilees/:id/lines/:lineIndex', dockerController.updateLineInDockerFile);
router.get('/dockerfilees/:id/lines', dockerController.getLinesFromDockerFile);


module.exports = router;
