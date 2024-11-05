const Container = require('../models/Container');
const DockerImage = require('../models/Image'); 

const { exec } = require('child_process'); 






exec('docker ps -a --format "{{.ID}}"', async (error, stdout, stderr) => {
    if (error) {
        console.error('Error fetching Docker containers:', error);
        return;
    }

    const dockerContainerIds = stdout.trim().split('\n');
    await Container.deleteMany({ containerId: { $nin: dockerContainerIds } });
    console.log('Cleaned up stale containers from the database.');
});



exports.createContainer = async (req, res) => {
    try {
        const { imageName, containerName, port } = req.body;

        if (!imageName || !containerName) {
            return res.status(400).json({ error: 'Image name and container name are required.' });
        }

        const image = await DockerImage.findOne({ name: imageName });
        if (!image) {
            return res.status(404).json({ error: 'Docker image not found.' });
        }

        const portMapping = port ? `-p ${port}:${port}` : '';

        exec(`docker run -d ${portMapping} --name ${containerName} ${imageName}`, async (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const containerId = stdout.trim(); // Capture the container ID from the stdout

            const newContainer = new Container({
                name: containerName,
                containerId: containerId,
                image: imageName,
                port: port || null,
                status: 'running',
                dockerImage: image._id
            });

            await newContainer.save(); // Save the container details in the database

            res.status(201).json({ message: 'Container created successfully', container: newContainer });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Restart a container
exports.startContainer = async (req, res) => {
    try {
        const { id } = req.params; // Docker container ID from the URL
        const container = await Container.findOne({ containerId: id }); // Search by containerId

        if (!container) {
            return res.status(404).json({ error: 'Container not found' });
        }

        exec(`docker start ${container.containerId}`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            container.status = 'running'; // Update status in the database
            container.save()
                .then(() => res.status(200).json({ message: 'Container restarted successfully', container }))
                .catch(err => res.status(500).json({ error: err.message }));
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Stop a container
exports.stopContainer = async (req, res) => {
    try {
        const containerId = req.params.id;

        exec(`docker stop ${containerId}`, async (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const updatedContainer = await Container.findOneAndUpdate(
                { containerId }, 
                { status: 'exited' },  // Update status
                { new: true }
            );

            if (!updatedContainer) {
                return res.status(404).json({ message: "Container not found in the database" });
            }

            res.status(200).json({ message: "Container stopped successfully", container: updatedContainer });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Delete a container
exports.deleteContainer = async (req, res) => {
    try {
        const containerId = req.params.id;

        exec(`docker rm -f ${containerId}`, async (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const deletedContainer = await Container.findOneAndDelete({ containerId });
            if (!deletedContainer) {
                return res.status(404).json({ message: "Container not found in the database" });
            }

            res.status(200).json({ message: "Container deleted successfully" });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Get the status of a container
exports.getStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const container = await Container.findById(id);
        
        if (!container) {
            return res.status(404).json({ error: 'Container not found' });
        }

        exec(`docker ps -a --filter "name=${container.name}" --format "{{.Status}}"`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.status(200).json({ status: stdout.trim() });
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
// Get all containers
exports.listContainers = async (req, res) => {
    try {
        exec('docker ps -a --format "{{.ID}} {{.Names}} {{.Image}} {{.Status}}"', async (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const containerList = stdout.trim().split('\n').map(line => {
                const [containerId, name, image, status] = line.split(' ', 4);
                return { containerId, name, image, status };
            });

            for (const container of containerList) {
                try {
                    const existingContainer = await Container.findOne({ name: container.name });

                    if (!existingContainer) {
                        const dockerImage = await DockerImage.findOne({ name: container.image });

                        if (dockerImage) {
                            const newContainer = new Container({
                                name: container.name,
                                containerId: container.containerId,
                                image: container.image,
                                status: container.status,
                                dockerImage: dockerImage._id 
                            });
                            await newContainer.save();
                        } else {
                            console.warn(`DockerImage not found for container ${container.name} with image ${container.image}`);
                        }
                    } else {
                        console.log(`Container with name ${container.name} already exists, skipping...`);
                    }
                } catch (err) {
                    console.error(`Error saving container ${container.name}:`, err.message);
                }
            }

            res.status(200).json(containerList);
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

