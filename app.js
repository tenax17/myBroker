const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const User = require('./models/User');

dotenv.config();

const app = express();

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Express Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using HTTPS
}));

// ✅ Attach user to req and views
app.use(async (req, res, next) => {
  if (!req.session.userId) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const user = await User.findById(req.session.userId).lean();
    req.user = user || null;
    res.locals.user = user || null;
  } catch (err) {
    console.error('❌ Session lookup failed:', err.message);
    req.user = null;
    res.locals.user = null;
  }

  next();
});

// ✅ Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);       // Login, Register, Logout
app.use('/', userRoutes);           // /dashboard, /profile, etc.
app.use('/admin', adminRoutes);     // /admin/dashboard, etc.

// ✅ Homepage
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Welcome',
    user: res.locals.user
  });
});

// ✅ 404 Page
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    user: res.locals.user
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;