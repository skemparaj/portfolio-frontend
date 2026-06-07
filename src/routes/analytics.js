const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

// Public tracking routes
router.post('/track-visit', analyticsController.trackVisit);
router.post('/track-heartbeat', analyticsController.trackHeartbeat);
router.post('/track-download', analyticsController.trackDownload);
router.post('/track-heatmap', analyticsController.trackHeatmap);
router.get('/public-stats', analyticsController.getPublicStats);

// Export visitors/messages data
router.get('/export/visitors', analyticsController.exportVisitors);
router.get('/export/messages', analyticsController.exportMessages);

// Secured dashboard routes
router.get('/overview', authMiddleware, analyticsController.getOverviewStats);
router.get('/visitors', authMiddleware, analyticsController.getVisitorsList);
router.get('/downloads', authMiddleware, analyticsController.getDownloadsList);
router.get('/messages', authMiddleware, analyticsController.getMessagesList);
router.put('/messages/:id', authMiddleware, analyticsController.updateMessageStatus);
router.delete('/messages/:id', authMiddleware, analyticsController.deleteMessage);

module.exports = router;
