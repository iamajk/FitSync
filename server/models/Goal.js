// ============================================
// models/Goal.js — Fitness Goal Schema
// ============================================
const mongoose = require('mongoose');

// Sub-schema: Weight progress log entries
const ProgressEntrySchema = new mongoose.Schema({
  weight: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 200 },
});

const GoalSchema = new mongoose.Schema(
  {
    // Relationship: Goal belongs to a User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goalType: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'strength', 'custom'],
      required: [true, 'Goal type is required'],
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Weight goals
    startWeight: {
      type: Number,
      min: 0,
    },
    targetWeight: {
      type: Number,
      min: 0,
    },
    currentWeight: {
      type: Number,
      min: 0,
    },
    // Date targets
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetDate: {
      type: Date,
    },
    // Workout goals
    weeklyWorkoutTarget: {
      type: Number,
      default: 3,
      min: 0,
      max: 7,
    },
    dailyCalorieTarget: {
      type: Number,
      default: 2000,
      min: 0,
    },
    dailyWaterTarget: {
      type: Number, // in liters
      default: 2.5,
      min: 0,
    },
    // Progress tracking
    progressLog: [ProgressEntrySchema],
    // Status
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: Progress Percentage ──────────────────────
GoalSchema.virtual('progressPercentage').get(function () {
  if (!this.startWeight || !this.targetWeight || !this.currentWeight) return 0;

  const totalChange = Math.abs(this.targetWeight - this.startWeight);
  const currentChange = Math.abs(this.currentWeight - this.startWeight);

  if (totalChange === 0) return 100;
  return Math.min(100, Math.round((currentChange / totalChange) * 100));
});

// ── Virtual: Days Remaining ───────────────────────────
GoalSchema.virtual('daysRemaining').get(function () {
  if (!this.targetDate) return null;
  const today = new Date();
  const diff = this.targetDate - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

module.exports = mongoose.model('Goal', GoalSchema);
