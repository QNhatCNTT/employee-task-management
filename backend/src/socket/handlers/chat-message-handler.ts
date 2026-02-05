/**
 * Chat Message Handler
 * Handles all chat-related socket events with message acknowledgments
 */

import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../socket-events';
import * as chatService from '../../services/chat-service';
import { presenceStore } from './presence-handler';

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

export const registerChatHandlers = (io: TypedServer, socket: TypedSocket): void => {
  const userId = socket.data.userId!;
  const userRole = socket.data.userRole!;

  // Join chat room with acknowledgment
  socket.on('join-chat', async (data, callback) => {
    const { chatId } = data;

    try {
      const hasAccess = await chatService.validateChatAccess(userId, userRole, chatId);

      if (!hasAccess) {
        socket.emit('error', { code: 'ACCESS_DENIED', message: 'Access denied to chat' });
        callback?.({ success: false });
        return;
      }

      socket.join(chatId);

      // Load and send message history
      const messages = await chatService.getMessages(chatId);
      socket.emit('message-history', messages);

      // Mark messages as read and notify sender
      const readResult = await chatService.markAsRead(chatId, userId);
      if (readResult.count > 0) {
        socket.to(chatId).emit('messages-read', {
          chatId,
          readerId: userId,
          messageIds: readResult.messageIds,
        });
      }

      callback?.({ success: true });
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join chat' });
      callback?.({ success: false });
    }
  });

  // Leave chat room
  socket.on('leave-chat', (data) => {
    socket.leave(data.chatId);
  });

  // Send message with acknowledgment
  socket.on('send-message', async (data, callback) => {
    const { chatId, content, tempId } = data;

    if (!content.trim()) {
      callback({ success: false, error: 'Empty message' });
      return;
    }

    try {
      // Save message with 'sent' status
      const message = await chatService.saveMessage(chatId, userId, userRole, content.trim());
      const messageId = message.id!;

      // Acknowledge to sender - message saved
      callback({ success: true, messageId });

      // Emit status update to sender
      socket.emit('message-status-update', {
        messageId,
        tempId,
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      // Broadcast to room (including sender for consistency)
      io.to(chatId).emit('receive-message', message);

      // Check if recipient is online and in the chat room
      const [id1, id2] = chatId.split('_');
      const recipientId = id1 === userId ? id2 : id1;

      if (presenceStore.isOnline(recipientId)) {
        // Update status to delivered
        await chatService.updateMessageStatus(messageId, 'delivered');

        socket.emit('message-status-update', {
          messageId,
          tempId,
          status: 'delivered',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', { userId, userRole });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.chatId).emit('user-stop-typing', { userId });
  });

  // Mark messages as read
  socket.on('message-read', async (data) => {
    try {
      const result = await chatService.markAsRead(data.chatId, userId);

      if (result.count > 0) {
        // Notify message senders their messages were read
        socket.to(data.chatId).emit('messages-read', {
          chatId: data.chatId,
          readerId: userId,
          messageIds: result.messageIds,
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Load more messages (pagination)
  socket.on('load-more', async (data) => {
    try {
      const messages = await chatService.getMessages(
        data.chatId,
        50,
        new Date(data.beforeTimestamp) as any
      );
      socket.emit('more-messages', messages);
    } catch (error) {
      console.error('Error loading more messages:', error);
      socket.emit('error', { code: 'LOAD_FAILED', message: 'Failed to load messages' });
    }
  });
};
