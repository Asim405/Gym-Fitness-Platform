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

const app = express();

// ---- Global middleware ----
app.use(helmet());
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'development'
      ? true
      : [clientUrl, 'http://127.0.0.1:3000'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
app.use('/api/dashboard', dashboardRoutes);

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
