export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    assigneeId: string;
    managerId: string;
    assigneeName?: string;
    assigneeEmail?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

export type CreateTaskData = Pick<Task, 'title' | 'description' | 'assigneeId' | 'priority'> & {
    dueDate?: string;
};

export type UpdateTaskStatus = Pick<Task, 'status'>;

export type UpdateTaskData = Partial<CreateTaskData & { status: Task['status'] }>;
