const User = require('../models/User');

// 🛡️ Auth Middleware - Checks if user is logged in
const authMiddleware = async (req, res, next) => {
  try {
    // If already set by a previous middleware (like JWT), use it
    if (req.user) {
      res.locals.user = req.user;
      return next();
    }

    // Fallback to session-based auth
    const userId = req.session?.userId;
    if (!userId) {
      return res.redirect('/auth/login'); // Adjust path if needed
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).send('Authentication failed.');
  }
};

// 🛡️ Admin Middleware - Checks if user has admin role
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Access denied. Admins only.');
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
