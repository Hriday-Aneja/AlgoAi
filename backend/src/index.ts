/**
 * ========================================================================
 * IMPORTANT: Environment configuration MUST be imported first!
 * This validates all required environment variables before the app starts.
 * ========================================================================
 */
import env from './config/env';

import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './utils/errorHandler';

const app: Application = express();
let PORT = env.PORT;

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
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
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

// ─── Port Management: Handle conflicts gracefully ───────────────────────────────

/**
 * Start the server, automatically trying the next port if the current one is in use.
 * 
 * Flow:
 * 1. Try to start on the configured PORT
 * 2. If EADDRINUSE (port busy), try PORT+1, PORT+2, etc.
 * 3. Stop after trying 10 alternative ports
 * 4. Display clear messages about port binding
 * 
 * @param portToTry - The port number to attempt binding to
 * @param attemptsLeft - Number of fallback attempts remaining
 */
function startServer(portToTry: number, attemptsLeft: number = 10): void {
const server = app.listen(portToTry, "0.0.0.0", () => {
  console.log(`\n🚀 Server is running`);
  console.log(`   ➜  Local:   http://localhost:${portToTry}`);
  console.log(`   ➜  Health:  http://localhost:${portToTry}/api/health`);
  console.log(`   ➜  Env:     ${process.env.NODE_ENV || 'development'}\n`);
});

  // Handle port already in use
  server.on('error', (error: NodeJS.ErrnoException) => {
    // Port is already in use
    if (error.code === 'EADDRINUSE') {
      server.close();

      if (attemptsLeft > 0) {
        const nextPort = portToTry + 1;
        console.warn(`⚠️  Port ${portToTry} is already in use. Trying port ${nextPort}...`);
        startServer(nextPort, attemptsLeft - 1);
      } else {
        // Exhausted all retry attempts
        console.error(`\n❌ FATAL ERROR: Could not find an available port!`);
        console.error(`   Tried ports: ${portToTry - 10} to ${portToTry}`);
        console.error(`   All ports are in use. Please free up a port or restart your system.\n`);
        process.exit(1);
      }
      return;
    }

    // Other errors (permission denied, etc.)
    if (error.code === 'EACCES') {
      console.error(`\n❌ ERROR: Permission denied to use port ${portToTry}`);
      console.error(`   Ports below 1024 require admin/root privileges.\n`);
      process.exit(1);
    }

    // Unknown error
    console.error(`\n❌ Server error on port ${portToTry}:`, error.message);
    process.exit(1);
  });
}

// ─── Start Server ────────────────────────────────────────────────────────────

startServer(PORT);

export default app;
