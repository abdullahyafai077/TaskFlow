const express = require('express');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const { attachWorkspaceFromParam } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get(
  '/workspaces/:workspaceId/activity',
  attachWorkspaceFromParam,
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const logs = await AuditLog.find({ workspaceId: req.workspace._id })
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  })
);

module.exports = router;
