const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const {
  attachWorkspaceFromParam,
  attachWorkspaceFromProject,
  requireRole,
} = require('../middleware/rbac');
const { createError } = require('../middleware/errorHandler');
const { ROLES } = require('../utils/roles');
const { recordActivity } = require('../services/auditService');
const { emitToWorkspace } = require('../services/socketService');

const router = express.Router();

router.use(authenticate);

router.get(
  '/workspaces/:workspaceId/projects',
  attachWorkspaceFromParam,
  asyncHandler(async (req, res) => {
    const projects = await Project.find({
      workspaceId: req.workspace._id,
    }).sort({ createdAt: -1 });
    res.json(projects);
  })
);

router.post(
  '/workspaces/:workspaceId/projects',
  attachWorkspaceFromParam,
  requireRole(ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const { name, key, description } = req.body;
    if (!name?.trim() || !key?.trim()) {
      throw createError(400, 'name and key are required');
    }

    const project = await Project.create({
      workspaceId: req.workspace._id,
      name: name.trim(),
      key: key.trim().toUpperCase().slice(0, 6),
      description: description || '',
    });

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: 'project.created',
      entityType: 'project',
      entityId: project._id,
      message: `${req.user.name} created project ${project.key}`,
    });

    emitToWorkspace(req.workspace._id, 'project:created', project);
    res.status(201).json(project);
  })
);

router.patch(
  '/projects/:id',
  attachWorkspaceFromProject,
  requireRole(ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (name?.trim()) req.project.name = name.trim();
    if (description !== undefined) req.project.description = description;
    await req.project.save();

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: 'project.updated',
      entityType: 'project',
      entityId: req.project._id,
      message: `${req.user.name} updated project ${req.project.key}`,
    });

    emitToWorkspace(req.workspace._id, 'project:updated', req.project);
    res.json(req.project);
  })
);

router.delete(
  '/projects/:id',
  attachWorkspaceFromProject,
  requireRole(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await Task.deleteMany({ projectId: req.project._id });
    await req.project.deleteOne();

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: 'project.deleted',
      entityType: 'project',
      entityId: req.project._id,
      message: `${req.user.name} deleted project ${req.project.key}`,
    });

    emitToWorkspace(req.workspace._id, 'project:deleted', {
      _id: req.project._id,
      workspaceId: req.workspace._id,
    });

    res.json({ success: true, id: req.project._id });
  })
);

module.exports = router;
