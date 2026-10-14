let io = null;

function initSocket(socketIo) {
  io = socketIo;
}

function getIO() {
  return io;
}

function workspaceRoom(workspaceId) {
  return `workspace_${workspaceId}`;
}

function emitToWorkspace(workspaceId, event, payload) {
  if (!io) return;
  io.to(workspaceRoom(workspaceId)).emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  workspaceRoom,
  emitToWorkspace,
};
