const Docker = require('dockerode');
const DockerFile = require('../models/dockerfilee');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


const Image = require('../models/Image'); 
const docker = new Docker({ socketPath: '/var/run/docker.sock' });



const dockerfilePath = path.join(__dirname, 'Dockerfile');

exports.generateDockerfile = async (req, res) => {
    const dockerFileId = req.params.id;
    
    try {
      const dockerFile = await DockerFile.findById(dockerFileId);
      if (!dockerFile) {
        return res.status(404).json({ message: 'Dockerfile not found' });
      }
  
      const dockerfileContent = dockerFile.lines.join('\n');
  
      const filePath = path.join(__dirname,'..', 'Dockerfile');
      fs.writeFileSync(filePath, dockerfileContent);
  
      res.json({ message: 'Dockerfile generated successfully!' });
    } catch (error) {
      console.error('Error generating Dockerfile:', error);
      res.status(500).json({ message: 'Error generating Dockerfile' });
    }
  };


  
  
  exports.buildDockerImage = async (req, res) => {
    const { dockerfileId, imageName } = req.body;

    console.log('dockerfileId:', dockerfileId); 

    try {
        const dockerFile = await DockerFile.findById(dockerfileId);
        if (!dockerFile) {
            return res.status(404).json({ message: 'Dockerfile not found' });
        }

        const dockerfileContent = dockerFile.lines.join('\n');
        const filePath = path.join(__dirname, '..', 'Dockerfile');
        fs.writeFileSync(filePath, dockerfileContent);

        if (!imageName) {
            return res.status(400).json({ type: 'error', message: 'Image name is required' });
        }

        const stream = await docker.buildImage({
            context: path.dirname(filePath),
            src: ['Dockerfile']
        }, { t: imageName });

        let imageId;
        let errorMessage = '';

        stream.on('data', data => {
            const output = data.toString();
            console.log(output);

            if (output.includes('errorDetail')) {
                const errorDetail = JSON.parse(output);
                errorMessage = errorDetail.errorDetail.message;
            }

            const matches = output.match(/Successfully built ([a-f0-9]+)/);
            if (matches) {
                imageId = matches[1];
            }
        });

        stream.on('end', async () => {
            if (errorMessage) {
                return res.status(500).json({ type: 'error', message: `Error building Docker image: ${errorMessage}` });
            }

            if (imageId) {
                try {
                    const newImage = new Image({
                        name: imageName,
                        imageId: imageId,
                        dockerfileId: dockerFile._id, 
                        dateOfCreation: new Date()
                    });

                    await newImage.save();
                    console.log('Dockerfile ID:', dockerFile._id);

                    console.log('Docker image saved to database');
                    res.status(201).json({ type: 'success', message: 'Docker image built and saved successfully' });
                } catch (dbError) {
                    console.error('Error saving Docker image to database:', dbError);
                    res.status(500).json({ type: 'error', message: 'Docker image built but error saving to database' });
                }
            } else {
                console.error('Image ID not found in build output');
                res.status(500).json({ type: 'error', message: 'Error! Docker image built but Image ID not found' });
            }
        });

        stream.on('error', error => {
            console.error('Error during Docker image build:', error);
            res.status(500).json({ type: 'error', message: 'Error building Docker image' });
        });

    } catch (error) {
        console.error('Error building Docker image:', error);
        res.status(500).json({ type: 'error', message: 'An error occurred during the image build process' });
    }
};



    


      





exports.createDockerFile = (req, res) => {
    const dockerFile = new DockerFile({ lines: req.body.lines || [] });

    dockerFile.save()
        .then(data => res.send(data))
        .catch(err => res.status(500).send({
            message: err.message || "Some error occurred while creating the Docker file."
        }));
};

exports.getAllDockerFiles = (req, res) => {
    DockerFile.find()
        .then(dockerFiles => res.send(dockerFiles))
        .catch(err => res.status(500).send({
            message: err.message || "Some error occurred while retrieving Docker files."
        }));
};

exports.getDockerFileById = (req, res) => {
    DockerFile.findById(req.params.id)
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            res.send(dockerFile);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            return res.status(500).send({
                message: "Error retrieving Docker file with id " + req.params.id
            });
        });
};

exports.updateDockerFile = (req, res) => {
    DockerFile.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            res.send(dockerFile);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            return res.status(500).send({
                message: "Error updating Docker file with id " + req.params.id
            });
        });
};

exports.deleteDockerFile = (req, res) => {
    DockerFile.findByIdAndDelete(req.params.id)
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            res.send({ message: "Docker file deleted successfully!" });
        })
        .catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            return res.status(500).send({
                message: "Could not delete Docker file with id " + req.params.id
            });
        });
};

exports.addLineToDockerFile = (req, res) => {
    DockerFile.findById(req.params.id)
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            dockerFile.lines.push(req.body.line);
            dockerFile.save()
                .then(updatedDockerFile => res.send(updatedDockerFile))
                .catch(err => res.status(500).send({
                    message: err.message || "Some error occurred while adding the line."
                }));
        })
        .catch(err => res.status(500).send({
            message: err.message || "Error retrieving Docker file with id " + req.params.id
        }));
};

exports.deleteLineFromDockerFile = (req, res) => {
    DockerFile.findById(req.params.id)
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            dockerFile.lines.splice(req.params.lineIndex, 1);
            dockerFile.save()
                .then(updatedDockerFile => res.send(updatedDockerFile))
                .catch(err => res.status(500).send({
                    message: err.message || "Some error occurred while deleting the line."
                }));
        })
        .catch(err => res.status(500).send({
            message: err.message || "Error retrieving Docker file with id " + req.params.id
        }));
};

exports.updateLineInDockerFile = (req, res) => {
    DockerFile.findById(req.params.id)
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            dockerFile.lines[req.params.lineIndex] = req.body.line;
            dockerFile.save()
                .then(updatedDockerFile => res.send(updatedDockerFile))
                .catch(err => res.status(500).send({
                    message: err.message || "Some error occurred while updating the line."
                }));
        })
        .catch(err => res.status(500).send({
            message: err.message || "Error retrieving Docker file with id " + req.params.id
        }));
};

exports.getLinesFromDockerFile = (req, res) => {
    DockerFile.findById(req.params.id)
        .then(dockerFile => {
            if (!dockerFile) {
                return res.status(404).send({
                    message: "Docker file not found with id " + req.params.id
                });
            }
            res.send(dockerFile.lines);
        })
        .catch(err => res.status(500).send({
            message: err.message || "Error retrieving lines from Docker file with id " + req.params.id
        }));
};
