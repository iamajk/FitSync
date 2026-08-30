// ============================================
// routes/adminRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  getExercises,
  createExercise,
  deleteExercise,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Any authenticated user may VIEW the admin panel...
router.use(protect);

// ── Read-only endpoints (any logged-in user) ──────────
router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.get('/exercises', getExercises);

// ── Write endpoints (admin role required) ─────────────
router.delete('/user/:id', adminOnly, deleteUser);
router.put('/user/:id/toggle', adminOnly, toggleUserStatus);
router.post('/exercises', adminOnly, createExercise);
router.delete('/exercises/:id', adminOnly, deleteExercise);

module.exports = router;
