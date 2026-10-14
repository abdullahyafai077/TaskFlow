const mongoose = require('mongoose');
const { ROLES } = require('../utils/roles');

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER,
    },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

workspaceSchema.methods.getMember = function getMember(userId) {
  const id = String(userId);
  return this.members.find((m) => String(m.userId) === id) || null;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
