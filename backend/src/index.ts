import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './utils/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS — allow configured origins (defaults to Vite dev server)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────

// All API routes are prefixed with /api
app.use('/api', apiRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────

// 404 — must be after all routes
app.use(notFoundHandler);

// Global error handler — must be last and have 4 params
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Server is running`);
  console.log(`   ➜  Local:   http://localhost:${PORT}`);
  console.log(`   ➜  Health:  http://localhost:${PORT}/api/health`);
  console.log(`   ➜  Env:     ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
