const express = require('express');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const {
  attachWorkspaceFromParam,
  requireRole,
} = require('../middleware/rbac');
const { createError } = require('../middleware/errorHandler');
const { ROLES } = require('../utils/roles');
const { recordActivity } = require('../services/auditService');

const router = express.Router();

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'workspace'
  );
}

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const workspaces = await Workspace.find({
      'members.userId': req.user._id,
    })
      .populate('members.userId', 'name email')
      .populate('ownerId', 'name email')
      .sort({ updatedAt: -1 });
    res.json(workspaces);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) {
      throw createError(400, 'Workspace name is required');
    }

    let slug = slugify(name);
    const exists = await Workspace.findOne({ slug });
    if (exists) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      slug,
      ownerId: req.user._id,
      members: [{ userId: req.user._id, role: ROLES.ADMIN }],
    });

    await recordActivity({
      workspaceId: workspace._id,
      actorId: req.user._id,
      action: 'workspace.created',
      entityType: 'workspace',
      entityId: workspace._id,
      message: `${req.user.name} created workspace "${workspace.name}"`,
    });

    const populated = await Workspace.findById(workspace._id)
      .populate('members.userId', 'name email')
      .populate('ownerId', 'name email');

    res.status(201).json(populated);
  })
);

router.get(
  '/:workspaceId',
  attachWorkspaceFromParam,
  asyncHandler(async (req, res) => {
    const populated = await Workspace.findById(req.workspace._id)
      .populate('members.userId', 'name email')
      .populate('ownerId', 'name email');
    res.json(populated);
  })
);

router.patch(
  '/:workspaceId',
  attachWorkspaceFromParam,
  requireRole(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (name?.trim()) {
      req.workspace.name = name.trim();
    }
    await req.workspace.save();

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: 'workspace.updated',
      entityType: 'workspace',
      entityId: req.workspace._id,
      message: `${req.user.name} updated workspace settings`,
    });

    const populated = await Workspace.findById(req.workspace._id)
      .populate('members.userId', 'name email')
      .populate('ownerId', 'name email');

    res.json(populated);
  })
);

router.post(
  '/:workspaceId/members',
  attachWorkspaceFromParam,
  requireRole(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    if (!email) {
      throw createError(400, 'email is required');
    }

    const memberRole = Object.values(ROLES).includes(role)
      ? role
      : ROLES.MEMBER;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw createError(404, 'User not found. They must register first.');
    }

    if (req.workspace.getMember(user._id)) {
      throw createError(409, 'User is already a member');
    }

    req.workspace.members.push({ userId: user._id, role: memberRole });
    await req.workspace.save();

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: 'member.added',
      entityType: 'member',
      entityId: user._id,
      message: `${req.user.name} added ${user.name} as ${memberRole}`,
      meta: { role: memberRole },
    });

    const populated = await Workspace.findById(req.workspace._id)
      .populate('members.userId', 'name email')
      .populate('ownerId', 'name email');

    res.status(201).json(populated);
  })
);

module.exports = router;
