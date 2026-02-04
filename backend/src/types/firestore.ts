import { Timestamp } from 'firebase-admin/firestore';

export interface FirestoreUser {
  id?: string;
  phoneNumber?: string; // For managers
  email?: string; // For employees
  role: 'manager' | 'employee';
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreAuth {
  id?: string;
  userId: string;
  phoneNumber?: string;
  email?: string;
  accessCode: string; // Hashed OTP
  accessCodeExpiry: Timestamp;
  attempts: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreEmployee {
  id?: string;
  userId: string; // Reference to users collection doc id
  name: string;
  email: string;
  department: string;
  role: string; // Job title e.g. "Senior Developer"
  managerId: string;
  phone?: string;
  schedule?: {
    workDays: string[];
    startTime: string;
    endTime: string;
  };
  isActive: boolean;
  setupCompleted: boolean;
  setupToken?: string;
  setupTokenExpiry?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreMessage {
  id?: string;
  chatId: string; // managerId_employeeId
  senderId: string;
  senderRole: 'manager' | 'employee';
  content: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface FirestoreTask {
  id?: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  assignedBy: string; // Manager ID
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
