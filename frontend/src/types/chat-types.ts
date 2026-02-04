export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: 'manager' | 'employee';
  content: string;
  read: boolean;
  createdAt: string;
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
