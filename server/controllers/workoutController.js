// ============================================
// controllers/workoutController.js
// ============================================
const Workout = require('../models/Workout');

// ── GET /api/workouts ─────────────────────────────────
const getWorkouts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      workoutType,
      startDate,
      endDate,
      sortBy = 'workoutDate',
      order = 'desc',
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };
    if (workoutType) filter.workoutType = workoutType;
    if (startDate || endDate) {
      filter.workoutDate = {};
      if (startDate) {
        const from = new Date(startDate);
        from.setHours(0, 0, 0, 0);
        filter.workoutDate.$gte = from;
      }
      if (endDate) {
        // Treat a bare YYYY-MM-DD end date as "through the end of that day".
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        filter.workoutDate.$lte = to;
      }
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [workouts, total] = await Promise.all([
      Workout.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Workout.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: workouts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      workouts,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/workouts/stats ───────────────────────────
const getWorkoutStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Aggregate stats
    const [weeklyStats, allTimeStats, typeBreakdown] = await Promise.all([
      Workout.getWeeklyStats(userId),
      Workout.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalWorkouts: { $sum: 1 },
            totalCalories: { $sum: '$totalCaloriesBurned' },
            totalDuration: { $sum: '$totalDuration' },
            avgCalories: { $avg: '$totalCaloriesBurned' },
          },
        },
      ]),
      Workout.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$workoutType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      weeklyStats,
      allTime: allTimeStats[0] || { totalWorkouts: 0, totalCalories: 0, totalDuration: 0 },
      typeBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/workouts ────────────────────────────────
const createWorkout = async (req, res, next) => {
  try {
    const workoutData = { ...req.body, user: req.user._id };
    const workout = await Workout.create(workoutData);

    res.status(201).json({
      success: true,
      message: 'Workout logged successfully!',
      workout,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/workouts/:id ─────────────────────────────
const getWorkoutById = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    res.status(200).json({ success: true, workout });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/workouts/:id ─────────────────────────────
const updateWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Workout updated successfully',
      workout,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/workouts/:id ──────────────────────────
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkouts,
  getWorkoutStats,
  createWorkout,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};
