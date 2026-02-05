import { messageEntity, MessageDocument } from '../entities/message.entity';
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
): Promise<void> => {
  await messageEntity.markAllAsRead(chatId);
};

export const validateChatAccess = async (
  userId: string,
  userRole: 'manager' | 'employee',
  chatId: string
): Promise<boolean> => {
  const [id1, id2] = chatId.split('_');

  // Allow access if the user is one of the participants
  return userId === id1 || userId === id2;
};

export const getUnreadMessageCount = async (chatId: string): Promise<number> => {
  return messageEntity.getUnreadCount(chatId);
};
