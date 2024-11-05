const User = require('../models/User');
const session = require('express-session');
const store =new session.MemoryStore();
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');


// Configure session middleware
const app = express();

app.use(session({
  secret: 'Nada1234*', 
  saveUninitialized: false,
  resave:false,
  store,
 
  cookie: {
    maxAge: 30000
  }
}));

exports.createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create and save user
        const user = new User({ username, email, password });
        await user.save();

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to handle user login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    req.session.authenticated = true;
    req.session.user = { _id: user._id, email: user.email };
    res.json(req.session);
  } else {
    res.status(403).json({ msg: 'Bad credentials' });
  }
};


// user logout
exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
};


exports.getUserActivityData = async (req, res) => {
  try {
    const users = await User.find({});
    const data = users.map(user => ({
      username: user.username,
      lastActive: user.lastActive
    }));
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
};


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log('Validation failed: Missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log(`Attempting to update user with ID: ${req.params.id}`);

    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, password },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.log(`User not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`User updated: ${user}`);
    res.status(200).json(user);
  } catch (err) {
    console.log(`Error updating user: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
