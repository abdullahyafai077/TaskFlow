require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const {
  initSocket,
  workspaceRoom,
} = require('./services/socketService');
const { loadWorkspaceMembership } = require('./middleware/rbac');
const User = require('./models/User');

async function start() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET missing in .env');
    process.exit(1);
  }

  await connectDB(process.env.MONGO_URI);

  const app = createApp();
  const server = http.createServer(app);
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

  const io = new Server(server, {
    cors: {
      origin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  initSocket(io);

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) {
        return next(new Error('Invalid user'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.user.name} (${socket.id})`);

    socket.on('workspace:join', async (workspaceId, ack) => {
      try {
        await loadWorkspaceMembership(workspaceId, socket.user._id);
        await socket.join(workspaceRoom(workspaceId));
        socket.data.workspaceId = workspaceId;
        socket.to(workspaceRoom(workspaceId)).emit('presence:update', {
          type: 'join',
          user: socket.user.toSafeJSON(),
        });
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message });
        }
      }
    });

    socket.on('workspace:leave', async (workspaceId) => {
      await socket.leave(workspaceRoom(workspaceId));
      socket.to(workspaceRoom(workspaceId)).emit('presence:update', {
        type: 'leave',
        user: socket.user.toSafeJSON(),
      });
    });

    socket.on('disconnect', () => {
      const workspaceId = socket.data.workspaceId;
      if (workspaceId) {
        socket.to(workspaceRoom(workspaceId)).emit('presence:update', {
          type: 'leave',
          user: socket.user.toSafeJSON(),
        });
      }
      console.log(`User Disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
