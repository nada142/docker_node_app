const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const mainRoutes = require('./routes/main');
const connectDB = require('./config/db_config');
const activityRoutes = require('./routes/activityRoutes');
const Docker = require('dockerode');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

// Import models
const User = require('./models/User');
const Dockerfile = require('./models/dockerfilee');
const Image = require('./models/Image');
const Container = require('./models/Container');
const updateActivity = require('./middleware/updateActivity');

const app = express();

app.use(session({
    secret: 'Nada1234*',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: 'mongodb://localhost:27017/node_app',
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

connectDB();

// Docker connection
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
docker.ping((err, data) => {
    if (err) {
        console.error('Error connecting to Docker:', err);
    } else {
        console.log('Docker is connected:', data);
    }
});

// Check Docker connection
async function checkDocker() {
  try {
      const containers = await docker.listContainers();
      console.log('Docker is running. Containers:', containers);
  } catch (error) {
      console.error('Error connecting to Docker:', error.message);
  }
}
checkDocker();

app.use(activityRoutes);
app.use(updateActivity);

// Routes
app.use('/', mainRoutes);
app.use('', require('./routes/userRoutes'));
app.use('', require('./routes/dockerfileRoutes'));
app.use('', require('./routes/imagesRoutes'));
app.use('', require('./routes/containerRoutes'));

const statsRouter = require('./routes/stats');
app.use(statsRouter);

// Create HTTP server
const server = http.createServer(app);

// WebSocket server using the same HTTP server

const pty = require('node-pty');

const wss = new WebSocket.Server({ port: 8080 });

const url = require('url');



wss.on('connection', (ws, req) => {
  const queryParams = url.parse(req.url, true).query;
  const containerId = queryParams.containerId;

  if (!containerId) {
    ws.send('Error: Container ID is required.');
    ws.close();
    return;
  }

  const shell = pty.spawn('docker', ['exec', '-it', containerId, '/bin/bash'], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  let buffer = '';
  shell.on('data', (data) => {
    buffer += data;
    if (buffer.length > 0) {
      ws.send(buffer);
      buffer = ''; 
    }
  });

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'resize') {
        shell.resize(msg.cols, msg.rows);
      } else {
        shell.write(message);
      }
    } catch (e) {
      shell.write(message);
    }
  });

  ws.on('close', () => {
    shell.kill(); 
  });
});





console.log('WebSocket server running on ws://localhost:8080');

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
