// ============================================
// controllers/goalController.js
// ============================================
const Goal = require('../models/Goal');

// ── GET /api/goals ────────────────────────────────────
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: goals.length, goals });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/goals ───────────────────────────────────
const createGoal = async (req, res, next) => {
  try {
    const goalData = { ...req.body, user: req.user._id };
    const goal = await Goal.create(goalData);

    res.status(201).json({
      success: true,
      message: 'Goal created successfully!',
      goal,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/goals/:id ────────────────────────────────
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.status(200).json({ success: true, message: 'Goal updated', goal });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/goals/:id/progress ──────────────────────
const logProgress = async (req, res, next) => {
  try {
    const { weight, notes } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.progressLog.push({ weight, notes });
    goal.currentWeight = weight;
    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Progress logged!',
      progressPercentage: goal.progressPercentage,
      goal,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/goals/:id ─────────────────────────────
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.status(200).json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGoals, createGoal, updateGoal, logProgress, deleteGoal };
