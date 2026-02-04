import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  senderRole: 'manager' | 'employee';
  content: string;
  read: boolean;
  createdAt: Timestamp;
}

export const getChatId = (managerId: string, employeeId: string): string => {
  return [managerId, employeeId].sort().join('_');
};

export const saveMessage = async (
  chatId: string,
  senderId: string,
  senderRole: 'manager' | 'employee',
  content: string
): Promise<Message> => {
  const db = getDb();

  const message: Omit<Message, 'id'> = {
    chatId,
    senderId,
    senderRole,
    content,
    read: false,
    createdAt: Timestamp.now(),
  };

  const docRef = await db.collection('messages').add(message);

  return { id: docRef.id, ...message };
};

export const getMessages = async (
  chatId: string,
  limit = 50,
  beforeTimestamp?: Timestamp
): Promise<Message[]> => {
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
    .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
    .reverse();
};

export const markAsRead = async (
  chatId: string,
  readerId: string
): Promise<void> => {
  const db = getDb();

  const snapshot = await db
    .collection('messages')
    .where('chatId', '==', chatId)
    .where('read', '==', false)
    .where('senderId', '!=', readerId)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

export const validateChatAccess = async (
  userId: string,
  userRole: 'manager' | 'employee',
  chatId: string
): Promise<boolean> => {
  const db = getDb();
  const [id1, id2] = chatId.split('_');

  if (userRole === 'manager') {
    // Manager must own the employee
    const employeeId = id2 === userId ? id1 : id2;
    const employee = await db.collection('employees').doc(employeeId).get();
    return employee.exists && employee.data()?.managerId === userId;
  } else {
    // Employee must be linked to manager
    const snapshot = await db
      .collection('employees')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) return false;
    const employee = snapshot.docs[0].data();
    return chatId.includes(employee.managerId);
  }
};
