const AuditLog = require('../models/AuditLog');
const { emitToWorkspace } = require('./socketService');

async function recordActivity({
  workspaceId,
  actorId,
  action,
  entityType,
  entityId,
  message,
  meta = {},
}) {
  const log = await AuditLog.create({
    workspaceId,
    actorId,
    action,
    entityType,
    entityId,
    message,
    meta,
  });

  const populated = await AuditLog.findById(log._id)
    .populate('actorId', 'name email')
    .lean();

  emitToWorkspace(workspaceId, 'activity:new', populated);
  return populated;
}

module.exports = { recordActivity };
