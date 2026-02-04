import crypto from 'crypto';
import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

interface CreateEmployeeInput {
  name: string;
  email: string;
  department: string;
  role?: string;
  managerId: string;
}

interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  phone?: string;
  schedule?: {
    workDays: string[];
    startTime: string;
    endTime: string;
  };
}

export const generateSetupToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const createEmployee = async (input: CreateEmployeeInput) => {
  const db = getDb();
  const setupToken = generateSetupToken();

  // Create user record for employee
  const userRef = await db.collection('users').add({
    email: input.email,
    role: 'employee',
    name: input.name,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Create employee record
  const employeeRef = await db.collection('employees').add({
    userId: userRef.id,
    name: input.name,
    email: input.email,
    department: input.department,
    role: input.role || 'Employee',
    managerId: input.managerId,
    isActive: true,
    setupCompleted: false,
    setupToken,
    setupTokenExpiry: Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    ),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return { employeeId: employeeRef.id, setupToken };
};

export const getEmployeeById = async (employeeId: string, managerId: string) => {
  const db = getDb();
  const doc = await db.collection('employees').doc(employeeId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (data?.managerId !== managerId) return null; // Security check

  return { id: doc.id, ...data };
};

export const listEmployees = async (managerId: string) => {
  const db = getDb();
  const snapshot = await db
    .collection('employees')
    .where('managerId', '==', managerId)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateEmployee = async (
  employeeId: string,
  managerId: string,
  updates: UpdateEmployeeInput
) => {
  const db = getDb();
  const docRef = db.collection('employees').doc(employeeId);
  const doc = await docRef.get();

  if (!doc.exists) return null;
  if (doc.data()?.managerId !== managerId) return null;

  await docRef.update({
    ...updates,
    updatedAt: Timestamp.now(),
  });

  return { id: employeeId, ...updates };
};

export const deleteEmployee = async (employeeId: string, managerId: string) => {
  const db = getDb();
  const docRef = db.collection('employees').doc(employeeId);
  const doc = await docRef.get();

  if (!doc.exists) return false;
  if (doc.data()?.managerId !== managerId) return false;

  // Soft delete
  await docRef.update({
    isActive: false,
    updatedAt: Timestamp.now(),
  });

  return true;
};
