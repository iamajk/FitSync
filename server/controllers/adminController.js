// ============================================
// controllers/adminController.js
// ============================================
const User = require('../models/User');
const Workout = require('../models/Workout');
const Meal = require('../models/Meal');
const Goal = require('../models/Goal');
const Exercise = require('../models/Exercise');

// ── GET /api/admin/dashboard ──────────────────────────
const getAdminDashboard = async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalWorkouts,
      totalMeals,
      totalExercises,
      activeGoals,
      recentUsers,
      newUsersThisMonth,
      newUsersToday,
      calorieAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Workout.countDocuments(),
      Meal.countDocuments(),
      Exercise.countDocuments(),
      Goal.countDocuments({ status: 'active' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      Meal.aggregate([
        { $group: { _id: '$user', totalCalories: { $sum: '$calories' } } },
        { $group: { _id: null, avg: { $avg: '$totalCalories' } } },
      ]),
    ]);

    const avgCaloriesPerUser = calorieAgg[0] ? Math.round(calorieAgg[0].avg) : 0;

    // User growth by month (last 6 months)
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthLabelled = userGrowth.map((g) => ({
      ...g,
      date: `${monthNames[(g._id.month || 1) - 1]} ${g._id.year || ''}`.trim(),
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalWorkouts,
        totalMeals,
        totalExercises,
        activeGoals,
        newUsersThisMonth,
        newUsersToday,
        avgCaloriesPerUser,
      },
      recentUsers,
      userGrowth: growthLabelled,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/users ──────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/admin/user/:id ────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cascade delete user's data
    await Promise.all([
      Workout.deleteMany({ user: req.params.id }),
      Meal.deleteMany({ user: req.params.id }),
      Goal.deleteMany({ user: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      message: `User ${user.username} and all their data deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/admin/user/:id/toggle ────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/exercises ──────────────────────────
const getExercises = async (req, res, next) => {
  try {
    const { search, muscleGroup, difficulty, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [exercises, total] = await Promise.all([
      Exercise.find(filter).skip(skip).limit(parseInt(limit)).sort({ name: 1 }),
      Exercise.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, count: exercises.length, total, exercises });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/admin/exercises ─────────────────────────
const createExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.create({ ...req.body, addedBy: req.user._id, isApproved: true });
    res.status(201).json({ success: true, message: 'Exercise added to library', exercise });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/admin/exercises/:id ──────────────────
const deleteExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found' });
    res.status(200).json({ success: true, message: 'Exercise deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  getExercises,
  createExercise,
  deleteExercise,
};
