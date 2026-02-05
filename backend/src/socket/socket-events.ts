/**
 * Socket.io Typed Event Definitions
 * Provides type safety for all socket events between client and server
 */

import { MessageDocument } from '../entities/message.entity';

// Message status type
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

// Acknowledgment callback type
export type AckCallback<T = void> = (response: T) => void;

// Message acknowledgment response
export interface MessageAckResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Events emitted by client to server
export interface ClientToServerEvents {
  'join-chat': (
    data: { chatId: string },
    callback?: AckCallback<{ success: boolean }>
  ) => void;
  'leave-chat': (data: { chatId: string }) => void;
  'send-message': (
    data: { chatId: string; content: string; tempId: string },
    callback: AckCallback<MessageAckResponse>
  ) => void;
  typing: (data: { chatId: string }) => void;
  'stop-typing': (data: { chatId: string }) => void;
  'message-read': (data: { chatId: string }) => void;
  'load-more': (data: { chatId: string; beforeTimestamp: string }) => void;
  'get-online-users': (
    data: { userIds: string[] },
    callback: AckCallback<{ onlineUsers: string[] }>
  ) => void;
}

// Events emitted by server to client
export interface ServerToClientEvents {
  'message-history': (messages: MessageDocument[]) => void;
  'receive-message': (message: MessageDocument) => void;
  'message-status-update': (data: {
    messageId: string;
    tempId?: string;
    status: MessageStatus;
    timestamp: string;
  }) => void;
  'user-typing': (data: { userId: string; userRole: 'manager' | 'employee' }) => void;
  'user-stop-typing': (data: { userId: string }) => void;
  'messages-read': (data: {
    chatId: string;
    readerId: string;
    messageIds: string[];
  }) => void;
  'more-messages': (messages: MessageDocument[]) => void;
  'user-online': (data: { userId: string }) => void;
  'user-offline': (data: { userId: string }) => void;
  'presence-update': (data: { userId: string; isOnline: boolean }) => void;
  error: (data: { code: string; message: string }) => void;
}

// Inter-server events (for scaling with Redis adapter)
export interface InterServerEvents {
  ping: () => void;
}

// Per-socket data attached during authentication
export interface SocketData {
  userId: string;
  userRole: 'manager' | 'employee';
  userEmail: string;
  userPhone?: string;
}
