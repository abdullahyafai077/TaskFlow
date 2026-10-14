const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['task', 'project', 'workspace', 'member'],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ workspaceId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
