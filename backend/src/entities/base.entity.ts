/**
 * Base Entity class for all Firestore entities
 */

import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

export interface BaseDocument {
  id?: string;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export abstract class BaseEntity<T extends BaseDocument> {
  protected collection: FirebaseFirestore.CollectionReference<T>;
  protected db: FirebaseFirestore.Firestore;

  constructor(collectionName: string) {
    this.db = getDb();
    this.collection = this.db.collection(collectionName) as FirebaseFirestore.CollectionReference<T>;
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as T : null;
  }

  async findAll(): Promise<T[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Filter out undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

    const docRef = await this.collection.add({
      ...cleanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as T);
    return docRef.id;
  }

  async update(id: string, data: Partial<T>): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    // Filter out undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as Partial<T>;

    await docRef.update({
      ...cleanData,
      updatedAt: Timestamp.now(),
    });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  }

  protected async query(
    conditions: [string, FirebaseFirestore.WhereFilterOp, unknown][]
  ): Promise<T[]> {
    let query: FirebaseFirestore.Query = this.collection;

    for (const [field, op, value] of conditions) {
      query = query.where(field, op, value);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
  }
}
