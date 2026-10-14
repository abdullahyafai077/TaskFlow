require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { corsOptions } = require('./config/cors');
const {
  initSocket,
  workspaceRoom,
} = require('./services/socketService');
const { loadWorkspaceMembership } = require('./middleware/rbac');
const User = require('./models/User');

async function start() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing — set it in Render Environment');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET missing — set it in Render Environment');
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      ...corsOptions(),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
  const HOST = '0.0.0.0';

  // Listen FIRST so Render health checks pass, then connect DB
  await new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      console.log(`Server running on ${HOST}:${PORT}`);
      resolve();
    });
  });

  connectDB(process.env.MONGO_URI).catch((err) => {
    console.error('DB Connection Error (will retry on requests):', err.message);
    console.error(
      'Check: MONGO_URI in Render env, Atlas IP whitelist 0.0.0.0/0'
    );
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
