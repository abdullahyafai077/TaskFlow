const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { hasMinRole } = require('../utils/roles');
const { createError } = require('./errorHandler');
const asyncHandler = require('../utils/asyncHandler');

async function loadWorkspaceMembership(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw createError(404, 'Workspace not found');
  }
  const member = workspace.getMember(userId);
  if (!member) {
    throw createError(403, 'Not a member of this workspace');
  }
  return { workspace, role: member.role };
}

const attachWorkspaceFromParam = asyncHandler(async (req, res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id;
  const { workspace, role } = await loadWorkspaceMembership(
    workspaceId,
    req.user._id
  );
  req.workspace = workspace;
  req.memberRole = role;
  next();
});

const attachWorkspaceFromProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId || req.params.id);
  if (!project) {
    throw createError(404, 'Project not found');
  }
  const { workspace, role } = await loadWorkspaceMembership(
    project.workspaceId,
    req.user._id
  );
  req.project = project;
  req.workspace = workspace;
  req.memberRole = role;
  next();
});

const attachWorkspaceFromTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw createError(404, 'Task not found');
  }
  const { workspace, role } = await loadWorkspaceMembership(
    task.workspaceId,
    req.user._id
  );
  req.task = task;
  req.workspace = workspace;
  req.memberRole = role;
  next();
});

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.memberRole || !hasMinRole(req.memberRole, minRole)) {
      return next(
        createError(403, `Requires ${minRole} role or higher`)
      );
    }
    next();
  };
}

module.exports = {
  loadWorkspaceMembership,
  attachWorkspaceFromParam,
  attachWorkspaceFromProject,
  attachWorkspaceFromTask,
  requireRole,
};
