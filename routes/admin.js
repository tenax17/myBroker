const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// 🧭 Admin Dashboard - List All Users
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.render('admin/dashboard', { admin: req.user, users });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Failed to load admin dashboard.');
  }
});

// 👤 View Specific User (with screenshots)
router.get('/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');

    const trades = user.trades || [];
    const stats = {
      totalProfit: trades.reduce((acc, t) => acc + (t.profit || 0), 0),
      totalLoss: trades.reduce((acc, t) => acc + (t.loss || 0), 0),
      totalTrades: trades.length,
      withdrawals: (user.withdrawals || []).length
    };

    res.render('admin/user', { admin: req.user, user, stats });
  } catch (err) {
    console.error('Error loading user:', err);
    res.status(500).send('Failed to load user.');
  }
});

// 💰 Manually Update User Balance (Admin Credit/Debit)
router.post('/user/:id/update-balance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return res.status(400).send('Invalid amount');

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');

    user.balance += numAmount;
    await user.save();

    res.redirect(`/admin/user/${user._id}`);
  } catch (err) {
    console.error('Error updating balance:', err);
    res.status(500).send('Failed to update balance.');
  }
});

// ✅ Approve Withdrawal Request
router.post('/withdraw/:userId/:index/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send('User not found');

    const index = parseInt(req.params.index);
    if (!user.withdrawals || !user.withdrawals[index]) {
      return res.status(404).send('Withdrawal not found');
    }

    user.withdrawals[index].status = 'approved';
    await user.save();

    res.redirect(`/admin/user/${user._id}`);
  } catch (err) {
    console.error('Error approving withdrawal:', err);
    res.status(500).send('Failed to approve withdrawal.');
  }
});

// 📈 Add Trade (Admin Manual Entry)
router.post('/user/:id/add-trade', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, profit, loss } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');

    const numProfit = parseFloat(profit) || 0;
    const numLoss = parseFloat(loss) || 0;

    user.trades.push({
      type,
      profit: numProfit,
      loss: numLoss,
      date: new Date()
    });

    // Update balance based on trade
    user.balance += numProfit;
    user.balance -= numLoss;
    user.liveTrades = user.trades.length;

    await user.save();

    res.redirect(`/admin/user/${user._id}`);
  } catch (err) {
    console.error('Error adding trade:', err);
    res.status(500).send('Failed to add trade.');
  }
});

module.exports = router;
