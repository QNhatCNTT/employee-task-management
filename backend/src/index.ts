import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { envConfig } from "./config/env-config";
import { initializeFirebase } from "./config/firebase-admin-config";
import { errorHandler } from "./middleware/error-handler-middleware";
import { generalLimiter } from "./middleware/rate-limiter-middleware";
import managerAuthRoutes from "./routes/manager-auth-routes";
import employeeAuthRoutes from "./routes/employee-auth-routes";
import employeeRoutes from "./routes/employee-routes";
import profileRoutes from "./routes/profile-routes";
import taskRoutes from "./routes/task-routes";
import userRoutes from "./routes/user-routes";
import { setupSocketHandlers } from "./socket/socket-handler";

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: envConfig.FRONTEND_URL,
        methods: ["GET", "POST"],
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
app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
});

// Routes
app.use("/api/auth/manager", managerAuthRoutes);
app.use("/api/auth/employee", employeeAuthRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Socket.io handlers
setupSocketHandlers(io);

// Error handler
app.use(errorHandler);

httpServer.listen(envConfig.PORT, () => {
    console.log(`🚀 Server running on port ${envConfig.PORT}`);
});

export { app, io };
