const express = require('express');
const router = express.Router();

const {
    getDashboardSummary,
    getDailyBookings,
    getPeakHours,
    getRevenueByDay,
    getWeeklyComparison
} = require('../controllers/analyticsController');

const { verifyToken, allowRoles } = require('../middleware/authMiddleware');

/* ============================================================================
   ANALYTICS ROUTES - Turf Owner Only
   ============================================================================ */

// All routes require authentication and client role
router.use(verifyToken);
router.use(allowRoles('client'));

// Get dashboard summary (revenue, bookings, occupancy, rating)
router.get('/summary', getDashboardSummary);

// Get daily bookings chart data
router.get('/daily-bookings', getDailyBookings);

// Get peak hours analysis
router.get('/peak-hours', getPeakHours);

// Get revenue breakdown by day of week
router.get('/revenue-by-day', getRevenueByDay);

// Get weekly comparison (current vs previous week)
router.get('/weekly-comparison', getWeeklyComparison);

module.exports = router;
