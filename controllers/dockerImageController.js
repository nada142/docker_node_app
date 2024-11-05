const DockerImage = require('../models/Image');
const { exec } = require('child_process');
const Docker = require('dockerode');

const Container = require('../models/Container');


const docker = new Docker({ socketPath: '/var/run/docker.sock' });



// List all images

exports.listImages = async (req, res) => {
    try {
        const images = await DockerImage.find().select('name imageId dockerfileId');
        res.status(200).json(images);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Pull an image
exports.pullImage = async (req, res) => {
    try {
        const { name } = req.body;

        exec(`docker pull ${name}`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.status(200).json({ message: stdout });
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


exports.pushImage = async (req, res) => {
    const imageName = req.params.name;
    const { username, password, repository } = req.body;

    if (!imageName || !username || !password) {
        return res.status(400).json({ error: 'Image name and Docker Hub credentials are required.' });
    }

    try {
        const image = docker.getImage(imageName);
        const authConfig = {
            username: username,
            password: password,
        };

        image.push({ authconfig: authConfig }, (err, stream) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Docker push failed", error: err.message });
            }

            let errorOccurred = false;
            stream.on('data', (chunk) => {
                const parsedData = JSON.parse(chunk.toString());
                if (parsedData.error) {
                    errorOccurred = true;
                    res.status(500).json({ success: false, message: "Docker push failed", error: parsedData.error });
                }
            });

            stream.on('end', () => {
                if (!errorOccurred) {
                    res.status(200).json({ success: true, message: "Docker image pushed successfully" });
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};



// Delete an image
exports.deleteImage = async (req, res) => {
    try {
        const imageId = req.params.id;

        await docker.getImage(imageId).remove({ force: true });

        await DockerImage.findOneAndDelete({ imageId });

        res.status(200).send('Docker image deleted successfully');
    } catch (error) {
        console.error('Error deleting Docker image:', error.message);

        if (error.message.includes('conflict')) {
            res.status(409).json({ error: 'Cannot delete the image as it has dependent child images. Please delete the dependent images first.' });
        } else {
            res.status(500).json({ error: 'Failed to delete Docker image' });
        }
    }
};






// Run an image
exports.runImage = async (req, res) => {
    try {
        const { id } = req.params;

        const dockerImage = await DockerImage.findOne({ imageId: id });
        if (!dockerImage) {
            return res.status(404).json({ error: 'Image not found' });
        }

        let sanitizedImageName = dockerImage.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        sanitizedImageName = sanitizedImageName.replace(/^-+|-+$/g, '');
        const containerName = `${sanitizedImageName}-${Date.now()}`;
        
        exec(`docker run -d --name ${containerName} ${dockerImage.name}`, async (error, stdout, stderr) => {
            if (error) {
                console.error('Docker run error:', error.message); // Log Docker errors
                return res.status(500).json({ error: error.message });
            }

            try {
                const container = new Container({
                    name: containerName,
                    status: 'running',
                    dockerImage: dockerImage._id,
                    containerId: stdout.trim(), 
                });

                await container.save();
                res.status(200).json({ message: 'Container started and saved successfully', container });
            } catch (saveError) {
                console.error('Error saving container to database:', saveError.message);
                res.status(500).json({ error: 'Failed to save container to the database' });
            }
        });
    } catch (error) {
        console.error('General error:', error.message);
        res.status(400).json({ error: error.message });
    }
};


// Get status of an image
exports.getStatus = async (req, res) => {
    try {
        const { id } = req.params;

        exec(`docker images ${id}`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.status(200).json({ status: stdout });
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const DockerFile = require('../models/dockerfilee');
const Image = require('../models/Image'); 
const mongoose = require('mongoose');

exports.getDockerFile = async (req, res) => {
    try {
        const { imageId, dockerfileId } = req.params;
        console.log(`Received imageId: ${imageId}, dockerfileId: ${dockerfileId}`);

        if (!mongoose.Types.ObjectId.isValid(imageId) || !mongoose.Types.ObjectId.isValid(dockerfileId)) {
            return res.status(400).json({ message: 'Invalid image or Dockerfile ID' });
        }

        const image = await Image.findById(imageId);
        if (!image || !image.dockerfileId.equals(new mongoose.Types.ObjectId(dockerfileId))) {
            return res.status(404).json({ message: 'Dockerfile not found for this image' });
        }

        const dockerfile = await DockerFile.findById(dockerfileId);
        if (!dockerfile) {
            return res.status(404).json({ message: 'Dockerfile not found' });
        }

        res.json(dockerfile);
    } catch (error) {
        console.error('Error fetching Dockerfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};




exports.getImageById = async (req, res) => {
    try {
        const { id } = req.params;  
        console.log(`Received imageId: ${id}`);

        const images = await docker.listImages({ all: true });

        const image = images.find(img => img.Id.includes(id));

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const imageDetails = await docker.getImage(image.Id).inspect();
        res.json(imageDetails);
    } catch (error) {
        console.error('Error fetching image by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



    


