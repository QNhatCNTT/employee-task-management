/**
 * Socket Handler - Main Orchestrator
 * Registers all socket handlers and middleware
 */

import { Server as SocketIOServer } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './socket-events';
import { socketAuth, AuthenticatedSocket } from './socket-auth';
import { registerChatHandlers } from './handlers/chat-message-handler';
import { registerPresenceHandlers } from './handlers/presence-handler';

type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const setupSocketHandlers = (io: SocketIOServer): void => {
  const typedIo = io as TypedServer;

  // Authentication middleware
  typedIo.use(socketAuth);

  // Global error handling middleware
  typedIo.use((socket, next) => {
    socket.on('error', (err) => {
      console.error(`Socket error for user ${socket.data.userId}:`, err);
    });
    next();
  });

  typedIo.on('connection', (socket) => {
    // Copy auth data to socket.data for typed access
    const authSocket = socket as unknown as AuthenticatedSocket;
    socket.data.userId = authSocket.userId!;
    socket.data.userRole = authSocket.userRole!;
    socket.data.userEmail = authSocket.userEmail!;
    socket.data.userPhone = authSocket.userPhone;

    console.log(`User connected: ${socket.data.userId} (${socket.data.userRole})`);

    // Register modular handlers
    registerPresenceHandlers(typedIo, socket);
    registerChatHandlers(typedIo, socket);

    // Log disconnection (actual cleanup in presence handler)
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.data.userId} - ${reason}`);
    });
  });
};
