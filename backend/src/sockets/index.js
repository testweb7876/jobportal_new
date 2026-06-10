const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth Middleware ────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // ── Join Conversation ─────────────────────────────────────────────────
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Typing Indicators ─────────────────────────────────────────────────
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId,
      });
    });

    // ── Online Status ─────────────────────────────────────────────────────
    socket.broadcast.emit('user_online', { userId: socket.userId });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
