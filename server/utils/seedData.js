// ============================================
// utils/seedData.js — Seed Exercise Library & Admin
// Run: npm run seed
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Exercise = require('../models/Exercise');
const User = require('../models/User');

const exercises = [
  { name: 'Barbell Bench Press', muscleGroup: 'chest', category: 'strength', equipment: 'barbell', difficulty: 'intermediate', caloriesPerMinute: 8, instructions: 'Lie on a flat bench, grip the barbell slightly wider than shoulder-width, lower to chest and press up explosively. Keep feet flat on floor and back slightly arched.', tips: 'Avoid bouncing the bar off your chest. Control the descent.', isApproved: true },
  { name: 'Pull-Up', muscleGroup: 'back', category: 'strength', equipment: 'bodyweight', difficulty: 'intermediate', caloriesPerMinute: 7, instructions: 'Hang from a bar with overhand grip, pull your body up until chin clears the bar, lower slowly. Keep core engaged throughout.', tips: 'Full range of motion is key. Avoid kipping unless for CrossFit.', isApproved: true },
  { name: 'Squat', muscleGroup: 'quadriceps', category: 'strength', equipment: 'barbell', difficulty: 'intermediate', caloriesPerMinute: 9, instructions: 'Stand with feet shoulder-width apart, bar on upper back. Descend by pushing hips back and bending knees until thighs are parallel. Drive through heels to stand.', tips: 'Keep chest up and knees tracking over toes. Breathe in on descent.', isApproved: true },
  { name: 'Deadlift', muscleGroup: 'back', category: 'strength', equipment: 'barbell', difficulty: 'advanced', caloriesPerMinute: 10, instructions: 'Stand with bar over mid-foot. Hinge at hips and bend knees, grip bar just outside legs. Drive through floor while keeping back neutral to stand up.', tips: 'Never round your lower back. Engage lats before pulling.', isApproved: true },
  { name: 'Overhead Press', muscleGroup: 'shoulders', category: 'strength', equipment: 'barbell', difficulty: 'intermediate', caloriesPerMinute: 7, instructions: 'Stand holding bar at shoulder level. Press overhead until arms are locked out, then lower under control.', tips: 'Tuck chin as bar passes face. Lock out at top.', isApproved: true },
  { name: 'Dumbbell Curl', muscleGroup: 'biceps', category: 'strength', equipment: 'dumbbell', difficulty: 'beginner', caloriesPerMinute: 5, instructions: 'Stand holding dumbbells at sides, curl up while supinating wrist, squeeze at top, lower slowly.', tips: 'Keep elbows pinned to sides. Avoid swinging.', isApproved: true },
  { name: 'Tricep Dip', muscleGroup: 'triceps', category: 'strength', equipment: 'bodyweight', difficulty: 'beginner', caloriesPerMinute: 6, instructions: 'Place hands on parallel bars, lower body by bending elbows to 90°, push back up.', tips: 'Lean slightly forward to target chest more, stay upright for triceps.', isApproved: true },
  { name: 'Plank', muscleGroup: 'abs', category: 'strength', equipment: 'bodyweight', difficulty: 'beginner', caloriesPerMinute: 4, instructions: 'Hold a push-up position on forearms. Keep body in a straight line from head to heels. Breathe steadily.', tips: 'Do not let hips sag. Squeeze glutes and core simultaneously.', isApproved: true },
  { name: 'Running', muscleGroup: 'cardio', category: 'cardio', equipment: 'bodyweight', difficulty: 'beginner', caloriesPerMinute: 11, instructions: 'Maintain steady pace with natural arm swing. Land midfoot. Keep breathing rhythm with steps.', tips: 'Start slow and build pace. Use proper running shoes.', isApproved: true },
  { name: 'Burpee', muscleGroup: 'full_body', category: 'cardio', equipment: 'bodyweight', difficulty: 'intermediate', caloriesPerMinute: 13, instructions: 'From standing, drop to push-up position, do a push-up, jump feet to hands, then explode up with arms overhead.', tips: 'Maintain form even when tired. Scale by removing the push-up.', isApproved: true },
  { name: 'Lunges', muscleGroup: 'quadriceps', category: 'strength', equipment: 'bodyweight', difficulty: 'beginner', caloriesPerMinute: 7, instructions: 'Step forward into a lunge, lower back knee toward floor, push through front heel to return to start.', tips: 'Keep torso upright. Front knee should not go past toes.', isApproved: true },
  { name: 'Romanian Deadlift', muscleGroup: 'hamstrings', category: 'strength', equipment: 'barbell', difficulty: 'intermediate', caloriesPerMinute: 8, instructions: 'Hold bar at hip height, hinge at waist while keeping legs nearly straight, feel hamstring stretch, return to start.', tips: 'Keep bar close to body throughout. Do not round lower back.', isApproved: true },
  { name: 'Hip Thrust', muscleGroup: 'glutes', category: 'strength', equipment: 'barbell', difficulty: 'intermediate', caloriesPerMinute: 7, instructions: 'Sit against bench with bar on hips, drive hips up until body forms a straight line from shoulders to knees.', tips: 'Squeeze glutes hard at top. Keep chin tucked.', isApproved: true },
  { name: 'Calf Raise', muscleGroup: 'calves', category: 'strength', equipment: 'machine', difficulty: 'beginner', caloriesPerMinute: 4, instructions: 'Stand on edge of step or calf raise machine, rise up onto toes, hold briefly, lower slowly below starting position.', tips: 'Full range of motion is important for calf development.', isApproved: true },
  { name: 'Jump Rope', muscleGroup: 'cardio', category: 'cardio', equipment: 'other', difficulty: 'beginner', caloriesPerMinute: 12, instructions: 'Jump with both feet clearing the rope, keep jumps small and efficient. Wrists do the rotating.', tips: 'Start slow, find rhythm. Great warm-up activity.', isApproved: true },
];

// Core seed logic. Assumes a DB connection is already established.
const runSeed = async () => {
  console.log('🌱 Starting database seed...');

  // Refresh the built-in exercise library (leaves admin-added ones alone)
  await Exercise.deleteMany({ isApproved: true, addedBy: { $exists: false } });
  await Exercise.insertMany(exercises);
  console.log(`✅ Seeded ${exercises.length} exercises`);

    // Create admin account if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@fitsync.com' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@fitsync.com',
        password: 'Admin@123',
        role: 'admin',
        age: 30,
        weight: 75,
        height: 175,
        goal: 'maintenance',
      });
      console.log('✅ Admin account created: admin@fitsync.com / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create a demo account (used by the "Login as Demo User" button)
    const demoExists = await User.findOne({ email: 'demo@fitsync.com' });
    if (!demoExists) {
      await User.create({
        username: 'demo',
        email: 'demo@fitsync.com',
        password: 'Demo@123',
        role: 'user',
        age: 25,
        weight: 70,
        height: 175,
        goal: 'muscle_gain',
      });
      console.log('✅ Demo account created: demo@fitsync.com / Demo@123');
    } else {
      console.log('ℹ️  Demo user already exists');
    }

  console.log('🎉 Database seed complete.');
};

// CLI entry point: `npm run seed`
const seedDatabase = async () => {
  try {
    await connectDB();
    await runSeed();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { runSeed, seedDatabase };
