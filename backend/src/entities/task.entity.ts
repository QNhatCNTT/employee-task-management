/**
 * Task Entity
 * Represents tasks collection in Firestore
 */

import { BaseEntity, BaseDocument } from './base.entity';
import { Timestamp } from 'firebase-admin/firestore';

export interface TaskDocument extends BaseDocument {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  managerId: string;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
}

export class TaskEntity extends BaseEntity<TaskDocument> {
  constructor() {
    super('tasks');
  }

  async findByAssignee(assigneeId: string): Promise<TaskDocument[]> {
    return this.query([['assigneeId', '==', assigneeId]]);
  }

  async findByManager(managerId: string): Promise<TaskDocument[]> {
    return this.query([['managerId', '==', managerId]]);
  }

  async findByStatus(status: TaskDocument['status']): Promise<TaskDocument[]> {
    return this.query([['status', '==', status]]);
  }

  async createNew(
    title: string,
    description: string,
    assigneeId: string,
    managerId: string,
    priority: TaskDocument['priority'] = 'medium',
    dueDate?: Date
  ): Promise<string> {
    return this.create({
      title,
      description,
      status: 'pending',
      priority,
      assigneeId,
      managerId,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
    });
  }

  async markComplete(id: string): Promise<boolean> {
    return this.update(id, {
      status: 'completed',
      completedAt: Timestamp.now(),
    });
  }

  async updateStatus(id: string, status: TaskDocument['status']): Promise<boolean> {
    const updateData: Partial<TaskDocument> = { status };
    if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    }
    return this.update(id, updateData);
  }
}

export const taskEntity = new TaskEntity();
