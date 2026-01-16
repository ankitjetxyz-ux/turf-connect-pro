const express = require('express');
const router = express.Router();

const { getAllAnalytics } = require('../controllers/analyticsController');
const { verifyToken, allowRoles } = require('../middleware/authMiddleware');

/* ============================================================================
   ANALYTICS ROUTES - Turf Owner Only
   ============================================================================ */

// All routes require authentication and client role
router.use(verifyToken);
router.use(allowRoles('client'));

/**
 * GET /api/analytics/all
 * Query params:
 *  - turf_id (required)
 *  - period (optional: 7days | 30days | 90days | 1year)
 */
router.get('/all', getAllAnalytics);

module.exports = router;
