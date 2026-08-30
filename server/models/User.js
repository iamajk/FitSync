// ============================================
// models/User.js — User Schema & Model
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Physical Stats
    age: {
      type: Number,
      min: [10, 'Age must be at least 10'],
      max: [120, 'Age cannot exceed 120'],
    },
    weight: {
      type: Number, // in kg
      min: [1, 'Weight must be positive'],
    },
    height: {
      type: Number, // in cm
      min: [50, 'Height must be at least 50cm'],
    },
    // Fitness Goal
    goal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'flexibility'],
      default: 'maintenance',
    },
    // Profile Image path (served from /uploads, or the bundled default)
    profileImage: {
      type: String,
      default: '/assets/default-avatar.svg',
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Last login timestamp
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: BMI Calculation ──────────────────────────
UserSchema.virtual('bmi').get(function () {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
});

// ── Pre-save Middleware: Hash Password ────────────────
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Method: Compare Password ──────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Method: Get Public Profile ────────────────────────
UserSchema.methods.getPublicProfile = function () {
  const userObj = this.toObject({ virtuals: true });
  delete userObj.password;
  return userObj;
};

module.exports = mongoose.model('User', UserSchema);
