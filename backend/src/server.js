const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

require('dotenv').config();

const connectDB = require('./config/database');
// const connectRedis = require('./config/redis');
const { initSocket } = require('./sockets');
// const { initQueues } = require('./queues');
const { initCronJobs } = require('./cron');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./config/swagger');

// ─── SENTRY ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const app = express();
const server = http.createServer(app);

// ─── CONNECT DB & REDIS ────────────────────────────────────────────────────
connectDB();
// connectRedis();

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── RATE LIMITING ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});

app.use('/api/', globalLimiter);
app.use('/api/', speedLimiter);

// ─── BODY PARSING ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

// ─── LOGGING ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  }));
}

// ─── STATIC FILES ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── SWAGGER DOCS ──────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── API ROUTES ────────────────────────────────────────────────────────────
const apiPrefix = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${apiPrefix}/auth`,          require('./routes/auth.routes'));
app.use(`${apiPrefix}/users`,         require('./routes/user.routes'));
app.use(`${apiPrefix}/jobs`,          require('./routes/job.routes'));
app.use(`${apiPrefix}/companies`,     require('./routes/company.routes'));
app.use(`${apiPrefix}/resumes`,       require('./routes/resume.routes'));
app.use(`${apiPrefix}/applications`,  require('./routes/application.routes'));
app.use(`${apiPrefix}/packages`,      require('./routes/package.routes'));
app.use(`${apiPrefix}/payments`,      require('./routes/payment.routes'));
app.use(`${apiPrefix}/notifications`, require('./routes/notification.routes'));
app.use(`${apiPrefix}/messages`,      require('./routes/message.routes'));
app.use(`${apiPrefix}/uploads`,       require('./routes/upload.routes'));
app.use(`${apiPrefix}/admin`,         require('./routes/admin.routes'));
app.use(`${apiPrefix}/categories`,    require('./routes/category.routes'));
app.use(`${apiPrefix}/analytics`,     require('./routes/analytics.routes'));
app.use(`${apiPrefix}/search`,        require('./routes/search.routes'));
app.use(`${apiPrefix}/interviews`,    require('./routes/interview.routes'));
app.use(`${apiPrefix}/followers`,     require('./routes/follower.routes'));
app.use(`${apiPrefix}/reports`,       require('./routes/report.routes'));

// ─── 404 HANDLER ──────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────
initSocket(server);

// ─── QUEUES & CRON ────────────────────────────────────────────────────────
// if (process.env.NODE_ENV !== 'test') {
//   initQueues();
//   if (process.env.ENABLE_CRON === 'true') initCronJobs();
// }

// ─── START SERVER ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});

// ─── UNHANDLED REJECTIONS ──────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

module.exports = { app, server };
