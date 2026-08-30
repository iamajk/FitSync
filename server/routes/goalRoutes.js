// ============================================
// routes/goalRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  logProgress,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getGoals).post(createGoal);
router.route('/:id').put(updateGoal).delete(deleteGoal);
router.post('/:id/progress', logProgress);

module.exports = router;
