const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs'); // ✅ added for password hashing

// ==========================
// Helper: Get full user
// ==========================
async function getFullUser(req) {
  return await User.findById(req.user?._id || req.user?.id);
}

// ==========================
// Multer Storage Setup
// ==========================
const uploadDir = path.join(__dirname, '../public/uploads/screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, req.user?._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ storage, fileFilter });

// ==========================
// Dashboard
// ==========================
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = await getFullUser(req);
    if (!user) return res.redirect('/auth/login');

    const trades = user.trades || [];
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      totalProfit: 0,
      totalLoss: 0,
      totalTrades: trades.length,
      dailyProfit: 0,
      dailyLoss: 0,
      dailyTrades: 0,
    };

    trades.forEach(t => {
      stats.totalProfit += t.profit || 0;
      stats.totalLoss += t.loss || 0;

      const tradeDate = new Date(t.date).toISOString().split('T')[0];
      if (tradeDate === today) {
        stats.dailyTrades += 1;
        stats.dailyProfit += t.profit || 0;
        stats.dailyLoss += t.loss || 0;
      }
    });

    res.render('dashboard', { title: 'Dashboard', user, stats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Dashboard failed.');
  }
});

// ==========================
// Deposit Page
// ==========================
router.get('/deposit', authMiddleware, async (req, res) => {
  try {
    const user = await getFullUser(req);
    if (!user) return res.redirect('/auth/login');

    const btcAddr = user.wallet?.btc || 'BTC_ADDRESS_HERE';

    res.render('deposit', { 
      title: 'Deposit', 
      user, 
      btcAddr, 
      message: null 
    });
  } catch (error) {
    console.error('Deposit page error:', error);
    res.status(500).send('Failed to load deposit page.');
  }
});

// ==========================
// Upload Screenshot
// ==========================
router.post('/upload-screenshot', authMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.render('deposit', {
        title: 'Deposit',
        user: req.user,
        btcAddr: req.user?.wallet?.btc || 'BTC_ADDRESS_HERE',
        message: '❌ No file uploaded!'
      });
    }

    const user = await getFullUser(req);
    if (!user) return res.redirect('/auth/login');

    // ✅ Save screenshot to DB (array)
    if (!user.screenshots) user.screenshots = [];
    user.screenshots.push({
      filename: `/uploads/screenshots/${req.file.filename}`,
      uploadedAt: new Date()
    });

    await user.save();

    res.render('deposit', {
      title: 'Deposit',
      user,
      btcAddr: user.wallet?.btc || 'BTC_ADDRESS_HERE',
      message: '✅ Screenshot uploaded successfully!'
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).send('Upload failed.');
  }
});

// ==========================
// Admin View Screenshots
// ==========================
router.get('/admin/screenshots', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ "screenshots.0": { $exists: true } }).lean();

    res.render('admin-screenshots', { 
      title: 'Deposit Screenshots', 
      users 
    });
  } catch (err) {
    console.error('Admin screenshot view error:', err);
    res.status(500).send('Failed to load screenshots.');
  }
});

// ==========================
// Withdraw Page
// ==========================
router.get('/withdraw', authMiddleware, async (req, res) => {
  try {
    const user = await getFullUser(req);
    if (!user) return res.redirect('/auth/login');

    const withdrawals = user.withdrawals || [];
    res.render('withdraw', { title: 'Withdraw', user, withdrawals });
  } catch (err) {
    console.error('Withdraw GET error:', err);
    res.status(500).send('Withdrawal page failed.');
  }
});

// ==========================
// Withdraw Submit
// ==========================
router.post('/withdraw', authMiddleware, async (req, res) => {
  const { amount, wallet, currency } = req.body;

  try {
    const user = await getFullUser(req);
    if (!user) return res.redirect('/auth/login');

    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      return res.status(400).send('Insufficient balance');
    }

    user.withdrawals = user.withdrawals || [];
    user.withdrawals.push({
      amount: numAmount,
      wallet,
      currency,
      status: 'pending',
      date: new Date()
    });

    user.balance -= numAmount;
    await user.save();

    res.redirect('/withdraw');
  } catch (err) {
    console.error('Withdraw POST error:', err);
    res.status(500).send('Withdrawal failed.');
  }
});

// ==========================
// Change Password (GET)
// ==========================

// Change Password Page
router.get('/change-password', authMiddleware, (req, res) => {
  res.render("change-password", { message: null });
});

// POST /change-password
router.post("/change-password", async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.render("change-password", { message: "User not found" });

    const { oldPassword, newPassword } = req.body;
    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.render("change-password", { message: "Old password is incorrect" });
    }

    user.password = newPassword; // triggers pre('save') hash
    await user.save();

    res.render("change-password", { message: "Password changed successfully!" });
  } catch (err) {
    console.error(err);
    res.render("change-password", { message: "Something went wrong. Try again." });
  }
});

module.exports = router;
