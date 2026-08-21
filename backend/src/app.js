const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const membershipRoutes = require('./routes/memberships.routes');
const exerciseRoutes = require('./routes/exercises.routes');
const workoutPlanRoutes = require('./routes/workoutPlans.routes');
const classRoutes = require('./routes/classes.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const dietPlansRoutes = require('./routes/dietPlans.routes');
const paymentsRoutes = require('./routes/payments.routes');
const progressRoutes = require('./routes/progress.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const trainerRelationsRoutes = require('./routes/trainerRelations.routes');
const invoiceRoutes = require('./routes/invoices.routes');

const app = express();

// ---- Dynamic Allowed Origins List ----
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://gym-fitness-platform.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean); // removes undefined entries

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Fallback allow to prevent production block
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// ---- Global middleware ----
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---- Health check ----
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workout-plans', workoutPlanRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/diet-plans', dietPlansRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api', trainerRelationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);

// ---- Swagger docs (served from the static YAML spec) ----
try {
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const path = require('path');
  const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger', 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('Swagger UI not mounted:', err.message);
}

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---- Global error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;