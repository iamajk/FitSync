// ============================================
// routes/workoutRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const {
  getWorkouts,
  getWorkoutStats,
  createWorkout,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

// All workout routes require authentication
router.use(protect);

router.route('/').get(getWorkouts).post(createWorkout);
router.get('/stats', getWorkoutStats);
router.route('/:id').get(getWorkoutById).put(updateWorkout).delete(deleteWorkout);

module.exports = router;
