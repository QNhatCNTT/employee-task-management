import 'dotenv-flow/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { envConfig } from './config/env-config.js';
import { initializeFirebase } from './config/firebase-admin-config.js';
import { errorHandler } from './middleware/error-handler-middleware.js';
import { generalLimiter } from './middleware/rate-limiter-middleware.js';
import managerAuthRoutes from './routes/manager-auth-routes.js';
import employeeAuthRoutes from './routes/employee-auth-routes.js';
import employeeRoutes from './routes/employee-routes.js';
import profileRoutes from './routes/profile-routes.js';
import { setupSocketHandlers } from './socket/socket-handler.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: envConfig.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors({ origin: envConfig.FRONTEND_URL }));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Routes
app.use('/api/auth/manager', managerAuthRoutes);
app.use('/api/auth/employee', employeeAuthRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/profile', profileRoutes);

// Socket.io handlers
setupSocketHandlers(io);

// Error handler
app.use(errorHandler);

httpServer.listen(envConfig.PORT, () => {
  console.log(`🚀 Server running on port ${envConfig.PORT}`);
});

export { app, io };
