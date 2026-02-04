import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, socketAuth } from './socket-auth.js';
import * as chatService from '../services/chat-service.js';

export const setupSocketHandlers = (io: SocketIOServer): void => {
  io.use(socketAuth);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join chat room
    socket.on('join-chat', async (data: { chatId: string }) => {
      const { chatId } = data;

      // Validate access
      const hasAccess = await chatService.validateChatAccess(
        socket.userId!,
        socket.userRole!,
        chatId
      );

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      socket.join(chatId);

      // Load message history
      const messages = await chatService.getMessages(chatId);
      socket.emit('message-history', messages);

      // Mark messages as read
      await chatService.markAsRead(chatId, socket.userId!);
    });

    // Leave chat room
    socket.on('leave-chat', (data: { chatId: string }) => {
      socket.leave(data.chatId);
    });

    // Send message
    socket.on('send-message', async (data: { chatId: string; content: string }) => {
      const { chatId, content } = data;

      if (!content.trim()) return;

      const message = await chatService.saveMessage(
        chatId,
        socket.userId!,
        socket.userRole!,
        content.trim()
      );

      // Broadcast to room (including sender)
      io.to(chatId).emit('receive-message', message);
    });

    // Typing indicators
    socket.on('typing', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-typing', {
        userId: socket.userId,
        userRole: socket.userRole,
      });
    });

    socket.on('stop-typing', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-stop-typing', {
        userId: socket.userId,
      });
    });

    // Mark as read
    socket.on('message-read', async (data: { chatId: string }) => {
      await chatService.markAsRead(data.chatId, socket.userId!);
      socket.to(data.chatId).emit('messages-read', {
        chatId: data.chatId,
        readerId: socket.userId,
      });
    });

    // Load more messages
    socket.on('load-more', async (data: { chatId: string; beforeTimestamp: string }) => {
      const messages = await chatService.getMessages(
        data.chatId,
        50,
        new Date(data.beforeTimestamp) as any
      );
      socket.emit('more-messages', messages);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};
