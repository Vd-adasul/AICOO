import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import seedData from './utils/seed.js';

// Import Routers
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import twinRoutes from './routes/twins.js';
import projectRoutes from './routes/projects.js';
import decisionRoutes from './routes/decisions.js';
import meetingRoutes from './routes/meetings.js';
import documentRoutes from './routes/documents.js';
import aicooRoutes from './routes/aicoo.js';
import dashboardRoutes from './routes/dashboard.js';

// Setup ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from workspace root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/twins', twinRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api', aicooRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Admin Direct Seeding Route
app.post('/api/admin/seed', async (req, res) => {
  try {
    await seedData();
    res.json({ message: 'Database successfully re-seeded with 10 synthetic users and AICOO logs!' });
  } catch (error) {
    console.error('Seeding route error:', error);
    res.status(500).json({ message: 'Database seeding failed', error: error.message });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TwinOS Coordination Network API.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
