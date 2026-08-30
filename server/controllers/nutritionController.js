// ============================================
// controllers/nutritionController.js
// ============================================
const Meal = require('../models/Meal');

// ── GET /api/meals ────────────────────────────────────
const getMeals = async (req, res, next) => {
  try {
    const { date, mealType, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.mealTime = { $gte: start, $lte: end };
    }

    if (mealType) filter.mealType = mealType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [meals, total] = await Promise.all([
      Meal.find(filter)
        .sort({ mealTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meal.countDocuments(filter),
    ]);

    // Get daily totals for today
    const todayTotals = await Meal.getDailyTotals(req.user._id, date || new Date());

    res.status(200).json({
      success: true,
      count: meals.length,
      total,
      todayTotals,
      meals,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/meals/weekly ─────────────────────────────
const getWeeklyNutrition = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyData = await Meal.aggregate([
      { $match: { user: userId, mealTime: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$mealTime' } },
          totalCalories: { $sum: '$calories' },
          totalProtein: { $sum: '$protein' },
          totalCarbs: { $sum: '$carbs' },
          totalFats: { $sum: '$fats' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, weeklyData });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/meals ───────────────────────────────────
const createMeal = async (req, res, next) => {
  try {
    const mealData = { ...req.body, user: req.user._id };
    const meal = await Meal.create(mealData);

    res.status(201).json({
      success: true,
      message: 'Meal logged successfully!',
      meal,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/meals/:id ────────────────────────────────
const updateMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    res.status(200).json({ success: true, message: 'Meal updated', meal });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/meals/:id ─────────────────────────────
const deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    res.status(200).json({ success: true, message: 'Meal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMeals, getWeeklyNutrition, createMeal, updateMeal, deleteMeal };
