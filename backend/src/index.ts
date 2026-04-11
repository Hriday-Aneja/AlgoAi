import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './utils/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS — allow configured origins (supports multiple frontend ports)
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000',  // React dev server
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',  // Vite dev server (fallback port)
  'http://localhost:5175',  // Vite dev server (fallback port)
  'http://127.0.0.1:3000',  // Alternative localhost
  'http://127.0.0.1:5173',  // Alternative localhost
  'http://127.0.0.1:5174',  // Alternative localhost (fallback port)
  'http://127.0.0.1:5175',  // Alternative localhost (fallback port)
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: "http://localhost:5175",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
