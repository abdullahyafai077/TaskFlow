const express = require('express');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const {
  attachWorkspaceFromProject,
  attachWorkspaceFromTask,
  requireRole,
} = require('../middleware/rbac');
const { createError } = require('../middleware/errorHandler');
const { ROLES } = require('../utils/roles');
const { recordActivity } = require('../services/auditService');
const { emitToWorkspace } = require('../services/socketService');

const router = express.Router();

router.use(authenticate);

const populateTask = (q) =>
  q
    .populate('assigneeId', 'name email')
    .populate('createdBy', 'name email');

router.get(
  '/projects/:projectId/tasks',
  attachWorkspaceFromProject,
  asyncHandler(async (req, res) => {
    const filter = { projectId: req.project._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assigneeId = req.query.assignee;
    if (req.query.q) {
      filter.title = { $regex: req.query.q, $options: 'i' };
    }

    const tasks = await populateTask(
      Task.find(filter).sort({ status: 1, order: 1, createdAt: -1 })
    );
    res.json(tasks);
  })
);

router.post(
  '/projects/:projectId/tasks',
  attachWorkspaceFromProject,
  requireRole(ROLES.MEMBER),
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      status,
      priority,
      tags,
      assigneeId,
      subtasks,
    } = req.body;

    if (!title?.trim()) {
      throw createError(400, 'title is required');
    }

    const last = await Task.findOne({
      projectId: req.project._id,
      status: status || 'Todo',
    })
      .sort({ order: -1 })
      .select('order');

    const task = await Task.create({
      workspaceId: req.workspace._id,
      projectId: req.project._id,
      title: title.trim(),
      description: description || '',
      status: status || 'Todo',
      priority: priority || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      assigneeId: assigneeId || null,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      createdBy: req.user._id,
      order: last ? last.order + 1 : 0,
    });

    const populated = await populateTask(Task.findById(task._id));

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: 'task.created',
      entityType: 'task',
      entityId: task._id,
      message: `${req.user.name} created task "${task.title}"`,
      meta: { projectId: req.project._id, status: task.status },
    });

    emitToWorkspace(req.workspace._id, 'task:created', populated);
    res.status(201).json(populated);
  })
);

router.patch(
  '/tasks/:id',
  attachWorkspaceFromTask,
  requireRole(ROLES.MEMBER),
  asyncHandler(async (req, res) => {
    const allowed = [
      'title',
      'description',
      'status',
      'priority',
      'tags',
      'assigneeId',
      'subtasks',
      'order',
    ];

    const prevStatus = req.task.status;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        req.task[key] = req.body[key];
      }
    }

    await req.task.save();
    const populated = await populateTask(Task.findById(req.task._id));

    let message = `${req.user.name} updated task "${req.task.title}"`;
    if (req.body.status && req.body.status !== prevStatus) {
      message = `${req.user.name} moved "${req.task.title}" to ${req.body.status}`;
    }

    await recordActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      action: req.body.status && req.body.status !== prevStatus
        ? 'task.status_changed'
        : 'task.updated',
      entityType: 'task',
      entityId: req.task._id,
      message,
      meta: {
        projectId: req.task.projectId,
        from: prevStatus,
        to: req.task.status,
      },
    });

    emitToWorkspace(req.workspace._id, 'task:updated', populated);
    res.json(populated);
  })
);

router.delete(
  '/tasks/:id',
  attachWorkspaceFromTask,
  requireRole(ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const id = req.task._id;
    const workspaceId = req.workspace._id;
    const title = req.task.title;
    await req.task.deleteOne();

    await recordActivity({
      workspaceId,
      actorId: req.user._id,
      action: 'task.deleted',
      entityType: 'task',
      entityId: id,
      message: `${req.user.name} deleted task "${title}"`,
    });

    emitToWorkspace(workspaceId, 'task:deleted', {
      _id: id,
      workspaceId,
      projectId: req.task.projectId,
    });

    res.json({ success: true, id });
  })
);

// Bulk reorder helper used by DnD
router.post(
  '/projects/:projectId/tasks/reorder',
  attachWorkspaceFromProject,
  requireRole(ROLES.MEMBER),
  asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      throw createError(400, 'items array is required');
    }

    await Promise.all(
      items.map((item) =>
        Task.updateOne(
          { _id: item.id, projectId: req.project._id },
          { status: item.status, order: item.order }
        )
      )
    );

    const tasks = await populateTask(
      Task.find({ projectId: req.project._id }).sort({
        status: 1,
        order: 1,
      })
    );

    emitToWorkspace(req.workspace._id, 'task:reordered', {
      projectId: req.project._id,
      tasks,
    });

    res.json(tasks);
  })
);

module.exports = router;
