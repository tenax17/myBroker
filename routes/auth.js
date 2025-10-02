const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();
require('dotenv').config(); // Ensure environment variables are loaded

// GET: Register
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register',
    error: null,
    success: null,
    old: {}
  });
});

// POST: Register
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.render('register', {
      title: 'Register',
      error: 'All fields are required.',
      success: null,
      old: { username, email }
    });
  }

  if (password !== confirmPassword) {
    return res.render('register', {
      title: 'Register',
      error: 'Passwords do not match.',
      success: null,
      old: { username, email }
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        error: 'Username or email already exists.',
        success: null,
        old: { username, email }
      });
    }

    const user = new User({ username, email, password }); // password hashed via schema hook
    await user.save();

    res.render('register', {
      title: 'Register',
      error: null,
      success: 'Registration successful! You can now log in.',
      old: {}
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.render('register', {
      title: 'Register',
      error: 'Something went wrong. Try again later.',
      success: null,
      old: { username, email }
    });
  }
});

// GET: Login
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    error: null,
    success: null
  });
});

// POST: Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Both fields are required.',
      success: null
    });
  }

  try {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (!user) {
      return res.render('login', {
        title: 'Login',
        error: 'No user found with that username or email.',
        success: null
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', {
        title: 'Login',
        error: 'Incorrect password.',
        success: null
      });
    }

    req.session.userId = user._id;
    req.session.isAdmin = user.role === 'admin' || user.isAdmin;

    return res.redirect(req.session.isAdmin ? '/admin/dashboard' : '/dashboard');

  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', {
      title: 'Login',
      error: 'Login failed. Please try again later.',
      success: null
    });
  }
});

// GET: Forgot Password
router.get('/forgot', (req, res) => {
  res.render('forgot', {
    title: 'Forgot Password',
    error: null,
    success: null
  });
});

// POST: Forgot Password
router.post('/forgot', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render('forgot', {
      title: 'Forgot Password',
      error: 'Please enter your email.',
      success: null
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('forgot', {
        title: 'Forgot Password',
        error: 'No user found with that email.',
        success: null
      });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetURL = `${req.protocol}://${req.get('host')}/auth/reset/${token}`;
    const message = `
      <h3>Hello ${user.username},</h3>
      <p>You requested to reset your password.</p>
      <p><a href="${resetURL}">Click here to reset your password</a></p>
      <small>If you didn't request this, ignore this email.</small>
    `;

    await sendEmail(user.email, 'Password Reset Request', message);

    res.render('forgot', {
      title: 'Forgot Password',
      error: null,
      success: 'A password reset link has been sent to your email.'
    });
  } catch (err) {
    console.error('Forgot Error:', err);
    res.render('forgot', {
      title: 'Forgot Password',
      error: 'Something went wrong.',
      success: null
    });
  }
});

// GET: Reset Password Form
router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.send('Invalid or expired token.');

    res.render('reset', {
      title: 'Reset Password',
      error: null,
      success: null,
      token: req.params.token
    });
  } catch (err) {
    console.error('Reset GET Error:', err);
    res.send('Something went wrong.');
  }
});

// POST: Reset Password
router.post('/reset/:token', async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.render('reset', {
      title: 'Reset Password',
      error: 'All fields are required.',
      success: null,
      token: req.params.token
    });
  }

  if (password !== confirmPassword) {
    return res.render('reset', {
      title: 'Reset Password',
      error: 'Passwords do not match.',
      success: null,
      token: req.params.token
    });
  }

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.send('Invalid or expired token.');

    user.password = password; // Will be hashed in schema hook
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.render('login', {
      title: 'Login',
      error: null,
      success: 'Password reset successful! You can now log in.'
    });
  } catch (err) {
    console.error('Reset POST Error:', err);
    res.send('Error resetting password.');
  }
});

// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// GET: Initialize Admin
router.get('/init-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) return res.send('✅ Admin already exists.');

    const admin = new User({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD, // 👈 Plain password here (will be hashed by schema)
      role: 'admin',
      isAdmin: true
    });

    await admin.save(); // 👈 Triggers pre-save password hash
    return res.send('✅ Admin created successfully.');
  } catch (err) {
    console.error('Admin creation error:', err);
    return res.status(500).send('❌ Failed to create admin.');
  }
});


module.exports = router;