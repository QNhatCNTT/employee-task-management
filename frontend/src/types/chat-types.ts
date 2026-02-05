// Message delivery status
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: 'manager' | 'employee';
  content: string;
  read: boolean;
  status: MessageStatus;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  // Temporary ID for optimistic updates (client-side only)
  tempId?: string;
}

export interface TypingUser {
  userId: string;
  userRole: 'manager' | 'employee';
}

export interface Chat {
  id: string;
  employeeId: string;
  managerId: string;
  employeeName: string;
  employeeDepartment: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

// Socket event payloads
export interface MessageStatusUpdate {
  messageId: string;
  tempId?: string;
  status: MessageStatus;
  timestamp: string;
}

export interface MessagesReadPayload {
  chatId: string;
  readerId: string;
  messageIds: string[];
}

export interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
}

// Connection state
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
