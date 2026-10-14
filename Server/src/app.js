const express = require('express');
const cors = require('cors');
const { corsOptions } = require('./config/cors');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const activityRoutes = require('./routes/activity');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { isDbConnected } = require('./config/db');

function createApp() {
  const app = express();
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    const db = isDbConnected();
    res.json({
      ok: true,
      service: 'taskflow-api',
      db: db ? 'connected' : 'disconnected',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', projectRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', activityRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
