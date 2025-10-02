const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 🔹 Trade Schema
const tradeSchema = new mongoose.Schema({
  type: String,
  profit: { type: Number, default: 0 },
  loss: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { _id: false });

// 🔹 Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
  amount: Number,
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
}, { _id: false });

// 🔹 Wallet Schema
const walletSchema = new mongoose.Schema({
  address: String,
  qrCode: String
}, { _id: false });

// 🔹 Screenshot Schema
const screenshotSchema = new mongoose.Schema({
  filename: { type: String, required: true }, // stored filename in /uploads/screenshots
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// 🔹 Main User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isAdmin: { type: Boolean, default: false }, // Optional legacy flag
  
  balance: { type: Number, default: 0 },
  trades: [tradeSchema],
  withdrawals: [withdrawalSchema],
  wallet: walletSchema,

  // 🖼️ Screenshots uploaded by the user
  screenshots: [screenshotSchema],

  // 🔐 Password Reset
  resetToken: String,
  resetTokenExpiry: Date,
}, {
  timestamps: true // createdAt & updatedAt
});

// 🔒 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔐 Compare password
userSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
