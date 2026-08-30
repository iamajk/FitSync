// ============================================
// models/Exercise.js — Exercise Library Schema
// ============================================
const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: [
        'chest', 'back', 'shoulders', 'biceps', 'triceps',
        'forearms', 'abs', 'quadriceps', 'hamstrings',
        'glutes', 'calves', 'full_body', 'cardio', 'other'
      ],
    },
    secondaryMuscles: [{ type: String }],
    category: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'sport'],
      default: 'strength',
    },
    equipment: {
      type: String,
      enum: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'resistance_band', 'kettlebell', 'other'],
      default: 'bodyweight',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },
    tips: {
      type: String,
      maxlength: [500, 'Tips cannot exceed 500 characters'],
    },
    // Estimated calories burned per minute
    caloriesPerMinute: {
      type: Number,
      default: 5,
      min: 0,
    },
    // Image/video URL for the exercise
    imageUrl: {
      type: String,
      default: '',
    },
    // Who added it
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Text index for search ─────────────────────────────
ExerciseSchema.index({ name: 'text', muscleGroup: 'text', category: 'text' });

module.exports = mongoose.model('Exercise', ExerciseSchema);
