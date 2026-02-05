/**
 * Presence Handler
 * Tracks user online/offline status and broadcasts presence changes
 */

import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../socket-events';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// In-memory presence store (for single server; use Redis for scaling)
class PresenceStore {
  private onlineUsers: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  addUser(userId: string, socketId: string): boolean {
    const isNewUser = !this.onlineUsers.has(userId);

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);

    return isNewUser;
  }

  removeUser(userId: string, socketId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);

    // User is offline when all sockets disconnected
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      return true; // User went offline
    }

    return false;
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }

  getOnlineUsers(userIds: string[]): string[] {
    return userIds.filter((id) => this.isOnline(id));
  }

  getAllOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}

export const presenceStore = new PresenceStore();

export const registerPresenceHandlers = (_io: TypedServer, socket: TypedSocket): void => {
  const userId = socket.data.userId!;

  // Track user as online
  const isNewUser = presenceStore.addUser(userId, socket.id);

  if (isNewUser) {
    // Broadcast to all connected clients that user is online
    socket.broadcast.emit('user-online', { userId });
    socket.broadcast.emit('presence-update', { userId, isOnline: true });
    console.log(`User online: ${userId}`);
  }

  // Handle get-online-users request
  socket.on('get-online-users', (data, callback) => {
    const onlineUsers = presenceStore.getOnlineUsers(data.userIds);
    callback({ onlineUsers });
  });

  // Handle disconnect - clean up presence
  socket.on('disconnect', () => {
    const wentOffline = presenceStore.removeUser(userId, socket.id);

    if (wentOffline) {
      // Broadcast to all connected clients that user is offline
      socket.broadcast.emit('user-offline', { userId });
      socket.broadcast.emit('presence-update', { userId, isOnline: false });
      console.log(`User offline: ${userId}`);
    }
  });
};
