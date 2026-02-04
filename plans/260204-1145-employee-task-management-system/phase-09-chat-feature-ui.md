# Phase 09: Chat Feature UI

## Context Links

- [Parent Plan](./plan.md)
- [Phase 08: Manager Dashboard UI](./phase-08-manager-dashboard-ui.md)
- [Phase 06: Real-time Chat](./phase-06-realtime-chat-socketio.md)
- [Frontend Research](./research/researcher-02-vite-react-frontend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 4h |
| Implementation Status | pending |
| Review Status | pending |

Build real-time chat UI with Socket.io integration for manager-employee communication.

## Key Insights

- Socket.io client auto-reconnects on disconnect
- Initialize socket after auth context ready
- Use React context for socket instance sharing
- Typing indicator with debounce
- Message list auto-scrolls to bottom

## Requirements

### Functional
- Chat list shows all employees for manager
- Message thread displays conversation
- Real-time message sending/receiving
- Typing indicator when other user types
- Message input with send button
- Unread message indicators
- Load message history on chat open

### Non-Functional
- Messages appear within 100ms
- Auto-reconnect on connection loss
- Scroll to newest message

## Architecture

```
ChatPage
├── ChatSidebar
│   └── ChatListItem (each employee)
└── ChatThread
    ├── MessageList
    │   └── MessageBubble (each message)
    ├── TypingIndicator
    └── MessageInput
```

### Socket Flow
1. User opens chat page
2. Socket connects with JWT auth
3. User clicks employee → joins chat room
4. Messages loaded from server
5. New messages broadcast in real-time
6. Typing events sent/received

## Related Code Files

### Files to Create
- `frontend/src/contexts/socket-context.tsx`
- `frontend/src/hooks/use-socket.ts`
- `frontend/src/hooks/use-chat.ts`
- `frontend/src/components/chat/chat-sidebar.tsx`
- `frontend/src/components/chat/chat-list-item.tsx`
- `frontend/src/components/chat/chat-thread.tsx`
- `frontend/src/components/chat/message-list.tsx`
- `frontend/src/components/chat/message-bubble.tsx`
- `frontend/src/components/chat/message-input.tsx`
- `frontend/src/components/chat/typing-indicator.tsx`
- `frontend/src/pages/manager-chat-page.tsx`
- `frontend/src/types/chat-types.ts`

### Files to Modify
- `frontend/src/App.tsx` (add chat route)
- `frontend/src/main.tsx` (add socket provider)

## Implementation Steps

### 1. Install Socket.io Client

```bash
cd frontend
npm install socket.io-client
```

### 2. Create Chat Types

`frontend/src/types/chat-types.ts`:
```typescript
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
```

### 3. Create Socket Context

`frontend/src/contexts/socket-context.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
```

### 4. Create useChat Hook

`frontend/src/hooks/use-chat.ts`:
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { Message, TypingUser } from '@/types/chat-types';

export const useChat = (chatId: string | null) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<TypingUser | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket || !chatId) return;

    // Join chat room
    socket.emit('join-chat', { chatId });

    // Listen for message history
    socket.on('message-history', (history: Message[]) => {
      setMessages(history);
    });

    // Listen for new messages
    socket.on('receive-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('user-typing', (user: TypingUser) => {
      setIsTyping(user);
    });

    socket.on('user-stop-typing', () => {
      setIsTyping(null);
    });

    // Listen for read receipts
    socket.on('messages-read', () => {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, read: true }))
      );
    });

    return () => {
      socket.emit('leave-chat', { chatId });
      socket.off('message-history');
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('messages-read');
    };
  }, [socket, chatId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !chatId || !content.trim()) return;
      socket.emit('send-message', { chatId, content: content.trim() });
    },
    [socket, chatId]
  );

  const sendTyping = useCallback(() => {
    if (!socket || !chatId) return;

    socket.emit('typing', { chatId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatId });
    }, 2000);
  }, [socket, chatId]);

  const markAsRead = useCallback(() => {
    if (!socket || !chatId) return;
    socket.emit('message-read', { chatId });
  }, [socket, chatId]);

  return {
    messages,
    isTyping,
    sendMessage,
    sendTyping,
    markAsRead,
  };
};
```

### 5. Create Chat Sidebar

`frontend/src/components/chat/chat-sidebar.tsx`:
```typescript
import { Employee } from '@/types/employee-types';
import { ChatListItem } from './chat-list-item';

interface ChatSidebarProps {
  employees: Employee[];
  selectedId: string | null;
  onSelect: (employee: Employee) => void;
}

export const ChatSidebar = ({ employees, selectedId, onSelect }: ChatSidebarProps) => {
  return (
    <div className="w-64 border-r bg-white overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Conversations</h2>
      </div>
      <div className="divide-y">
        {employees.map((employee) => (
          <ChatListItem
            key={employee.id}
            employee={employee}
            isSelected={selectedId === employee.id}
            onClick={() => onSelect(employee)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 6. Create Chat List Item

`frontend/src/components/chat/chat-list-item.tsx`:
```typescript
import { Employee } from '@/types/employee-types';

interface ChatListItemProps {
  employee: Employee;
  isSelected: boolean;
  onClick: () => void;
}

export const ChatListItem = ({ employee, isSelected, onClick }: ChatListItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <div className="font-medium">{employee.name}</div>
      <div className="text-sm text-gray-500">{employee.department}</div>
    </button>
  );
};
```

### 7. Create Message Bubble

`frontend/src/components/chat/message-bubble.tsx`:
```typescript
import { Message } from '@/types/chat-types';
import { useAuth } from '@/contexts/auth-context';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwn = message.senderId === user?.userId;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p>{message.content}</p>
        <div
          className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isOwn && (
            <span className="ml-2">{message.read ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 8. Create Message List

`frontend/src/components/chat/message-list.tsx`:
```typescript
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat-types';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
```

### 9. Create Typing Indicator

`frontend/src/components/chat/typing-indicator.tsx`:
```typescript
import { TypingUser } from '@/types/chat-types';

interface TypingIndicatorProps {
  typingUser: TypingUser | null;
}

export const TypingIndicator = ({ typingUser }: TypingIndicatorProps) => {
  if (!typingUser) return null;

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic">
      {typingUser.userRole === 'employee' ? 'Employee' : 'Manager'} is typing...
    </div>
  );
};
```

### 10. Create Message Input

`frontend/src/components/chat/message-input.tsx`:
```typescript
import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, onTyping, disabled }: MessageInputProps) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (content.trim()) {
      onSend(content);
      setContent('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setContent(value);
    onTyping();
  };

  return (
    <div className="p-4 border-t bg-white flex gap-2">
      <Input
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1"
      />
      <Button onClick={handleSend} disabled={disabled || !content.trim()}>
        Send
      </Button>
    </div>
  );
};
```

### 11. Create Chat Thread

`frontend/src/components/chat/chat-thread.tsx`:
```typescript
import { useEffect } from 'react';
import { Employee } from '@/types/employee-types';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/contexts/auth-context';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';

interface ChatThreadProps {
  employee: Employee | null;
}

export const ChatThread = ({ employee }: ChatThreadProps) => {
  const { user } = useAuth();

  const chatId = employee && user
    ? [user.userId, employee.id].sort().join('_')
    : null;

  const { messages, isTyping, sendMessage, sendTyping, markAsRead } = useChat(chatId);

  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  if (!employee) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select an employee to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold">{employee.name}</h2>
        <p className="text-sm text-gray-500">{employee.department}</p>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Typing indicator */}
      <TypingIndicator typingUser={isTyping} />

      {/* Input */}
      <MessageInput onSend={sendMessage} onTyping={sendTyping} />
    </div>
  );
};
```

### 12. Create Manager Chat Page

`frontend/src/pages/manager-chat-page.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatThread } from '@/components/chat/chat-thread';
import { getEmployees } from '@/services/employee-service';
import { Employee } from '@/types/employee-types';
import { useSocket } from '@/contexts/socket-context';

export const ManagerChatPage = () => {
  const { isConnected } = useSocket();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data.filter((e) => e.setupCompleted));
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-gray-100 -m-8">
        {!isConnected && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-center py-1 text-sm">
            Connecting to chat server...
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">Loading...</div>
        ) : (
          <>
            <ChatSidebar
              employees={employees}
              selectedId={selectedEmployee?.id || null}
              onSelect={setSelectedEmployee}
            />
            <ChatThread employee={selectedEmployee} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
```

### 13. Update App Router

Add to `frontend/src/App.tsx`:
```typescript
import { ManagerChatPage } from './pages/manager-chat-page';

// In routes:
<Route
  path="/dashboard/chat"
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <ManagerChatPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/dashboard/chat/:chatId"
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <ManagerChatPage />
    </ProtectedRoute>
  }
/>
```

### 14. Update main.tsx with Socket Provider

`frontend/src/main.tsx`:
```typescript
import { SocketProvider } from './contexts/socket-context';

// Wrap App:
<AuthProvider>
  <SocketProvider>
    <App />
  </SocketProvider>
</AuthProvider>
```

## Todo List

- [ ] Install socket.io-client
- [ ] Create chat types
- [ ] Create socket context
- [ ] Create useChat hook
- [ ] Create chat sidebar component
- [ ] Create chat list item component
- [ ] Create message bubble component
- [ ] Create message list component
- [ ] Create typing indicator component
- [ ] Create message input component
- [ ] Create chat thread component
- [ ] Create manager chat page
- [ ] Update App routes
- [ ] Update main.tsx with SocketProvider
- [ ] Test socket connection
- [ ] Test message sending
- [ ] Test real-time receiving
- [ ] Test typing indicators

## Success Criteria

- [ ] Socket connects with JWT auth
- [ ] Chat list shows employees
- [ ] Messages send and receive in real-time
- [ ] Message history loads on chat open
- [ ] Typing indicator displays
- [ ] Messages auto-scroll to bottom
- [ ] Read receipts update
- [ ] Reconnection works on disconnect

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Socket auth failure | Low | High | Clear error, redirect to login |
| Message ordering | Medium | Medium | Use server timestamp |
| Memory leak from listeners | Medium | Low | Cleanup in useEffect |

## Security Considerations

- Socket authenticated with JWT
- Validate chat room access
- Sanitize message content display
- Don't expose other users' IDs

## Next Steps

After completion:
1. Proceed to [Phase 10: Employee Dashboard UI](./phase-10-employee-dashboard-ui.md)
2. Test full chat flow between manager and employee
