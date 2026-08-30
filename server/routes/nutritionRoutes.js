// ============================================
// routes/nutritionRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const {
  getMeals,
  getWeeklyNutrition,
  createMeal,
  updateMeal,
  deleteMeal,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getMeals).post(createMeal);
router.get('/weekly', getWeeklyNutrition);
router.route('/:id').put(updateMeal).delete(deleteMeal);

module.exports = router;
