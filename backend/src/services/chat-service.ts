/**
 * Chat Service
 * Handles chat operations including message CRUD and status tracking
 */

import { messageEntity, MessageDocument, MessageStatus } from '../entities/message.entity';
import { getDb } from '../config/firebase-admin-config';
import { Timestamp } from 'firebase-admin/firestore';

export const getChatId = (managerId: string, employeeId: string): string => {
  return [managerId, employeeId].sort().join('_');
};

export const saveMessage = async (
  chatId: string,
  senderId: string,
  senderRole: 'manager' | 'employee',
  content: string
): Promise<MessageDocument> => {
  const messageId = await messageEntity.createMessage(
    chatId,
    senderId,
    senderRole,
    content
  );

  return messageEntity.findById(messageId) as Promise<MessageDocument>;
};

export const getMessages = async (
  chatId: string,
  limit = 50,
  beforeTimestamp?: Timestamp
): Promise<MessageDocument[]> => {
  const db = getDb();

  let query = db
    .collection('messages')
    .where('chatId', '==', chatId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (beforeTimestamp) {
    query = query.where('createdAt', '<', beforeTimestamp);
  }

  const snapshot = await query.get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as MessageDocument))
    .reverse();
};

export const markAsRead = async (
  chatId: string,
  readerId: string
): Promise<{ count: number; messageIds: string[] }> => {
  // Mark all messages not sent by reader as read
  return messageEntity.markAllAsRead(chatId, readerId);
};

export const updateMessageStatus = async (
  messageId: string,
  status: MessageStatus
): Promise<boolean> => {
  return messageEntity.updateStatus(messageId, status);
};

export const markMessagesDelivered = async (
  messageIds: string[]
): Promise<number> => {
  return messageEntity.markAsDelivered(messageIds);
};

export const validateChatAccess = async (
  userId: string,
  _userRole: 'manager' | 'employee',
  chatId: string
): Promise<boolean> => {
  const [id1, id2] = chatId.split('_');
  return userId === id1 || userId === id2;
};

export const getUnreadMessageCount = async (chatId: string): Promise<number> => {
  return messageEntity.getUnreadCount(chatId);
};

// Get undelivered messages for a user (messages sent to them while offline)
export const getUndeliveredMessages = async (
  userId: string
): Promise<MessageDocument[]> => {
  const db = getDb();

  // Find chats where user is participant and has undelivered messages
  const snapshot = await db
    .collection('messages')
    .where('status', '==', 'sent')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  // Filter messages where userId is the recipient (not sender)
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as MessageDocument))
    .filter((msg) => {
      const [id1, id2] = msg.chatId.split('_');
      const recipientId = msg.senderId === id1 ? id2 : id1;
      return recipientId === userId;
    });
};
