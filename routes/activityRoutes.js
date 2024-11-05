const express = require('express');
const router = express.Router();
const User = require('../models/User');

//fetch user activity data
router.get('/users/activity', async (req, res) => {
  try {
    const activityData = await User.find({}, 'username lastActive').sort({ lastActive: -1 });
    res.json(activityData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
