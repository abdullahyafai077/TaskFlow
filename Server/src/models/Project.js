const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 6,
    },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
