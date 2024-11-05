module.exports = function(req, res, next) {
    if (req.user) {
      req.user.lastActive = Date.now();
      req.user.save();
    }
    next();
  };