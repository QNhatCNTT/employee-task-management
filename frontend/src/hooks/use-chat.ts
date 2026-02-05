/**
 * Chat Hook
 * Manages chat state with optimistic updates and message status tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/socket-context';
import { useAuth } from '../contexts/auth-context';
import { Message, TypingUser, MessageStatusUpdate, MessagesReadPayload } from '../types/chat-types';

export const useChat = (chatId: string | null) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<TypingUser | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket || !chatId) return;

    // Join chat room
    socket.emit('join-chat', { chatId });

    // Listen for message history
    socket.on('message-history', (history: Message[]) => {
      // Ensure all messages have status field (backward compat)
      const normalizedHistory = history.map((msg) => ({
        ...msg,
        status: msg.status || (msg.read ? 'read' : 'sent'),
      }));
      setMessages(normalizedHistory);
    });

    // Listen for new messages
    socket.on('receive-message', (message: Message) => {
      setMessages((prev) => {
        // Check if message already exists (optimistic update or duplicate)
        const exists = prev.some(
          (m) => m.id === message.id || (m.tempId && m.tempId === message.tempId)
        );
        if (exists) {
          // Update the optimistic message with server data
          return prev.map((m) =>
            m.tempId === message.tempId || m.id === message.id
              ? { ...message, status: message.status || 'sent' }
              : m
          );
        }
        return [...prev, { ...message, status: message.status || 'sent' }];
      });
    });

    // Listen for message status updates
    socket.on('message-status-update', (data: MessageStatusUpdate) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId || (msg.tempId && msg.tempId === data.tempId)) {
            return { ...msg, status: data.status };
          }
          return msg;
        })
      );
    });

    // Listen for typing indicators
    socket.on('user-typing', (typingUser: TypingUser) => {
      setIsTyping(typingUser);
    });

    socket.on('user-stop-typing', () => {
      setIsTyping(null);
    });

    // Listen for read receipts
    socket.on('messages-read', (data: MessagesReadPayload) => {
      if (data.chatId !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id) ? { ...msg, read: true, status: 'read' } : msg
        )
      );
    });

    // Listen for more messages (pagination)
    socket.on('more-messages', (moreMessages: Message[]) => {
      const normalized = moreMessages.map((msg) => ({
        ...msg,
        status: msg.status || (msg.read ? 'read' : 'sent'),
      }));
      setMessages((prev) => [...normalized, ...prev]);
    });

    return () => {
      socket.emit('leave-chat', { chatId });
      socket.off('message-history');
      socket.off('receive-message');
      socket.off('message-status-update');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('messages-read');
      socket.off('more-messages');
    };
  }, [socket, chatId]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !chatId || !content.trim() || !user) return;

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const optimisticMessage: Message = {
        id: tempId,
        chatId,
        senderId: user.userId,
        senderRole: user.role,
        content: content.trim(),
        read: false,
        status: 'sending',
        createdAt: new Date().toISOString(),
        tempId,
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Send to server
      socket.emit(
        'send-message',
        { chatId, content: content.trim(), tempId },
        (response: { success: boolean; messageId?: string; error?: string }) => {
          if (!response?.success) {
            // Mark as failed - could add error status
            setMessages((prev) =>
              prev.map((m) => (m.tempId === tempId ? { ...m, status: 'sending' } : m))
            );
          }
        }
      );
    },
    [socket, chatId, user]
  );

  // Typing indicators
  const sendTyping = useCallback(() => {
    if (!socket || !chatId) return;

    socket.emit('typing', { chatId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatId });
    }, 2000);
  }, [socket, chatId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!socket || !chatId) return;
    socket.emit('message-read', { chatId });
  }, [socket, chatId]);

  // Load more messages
  const loadMore = useCallback(
    (beforeTimestamp: string) => {
      if (socket && chatId) {
        socket.emit('load-more', { chatId, beforeTimestamp });
      }
    },
    [socket, chatId]
  );

  return {
    messages,
    isTyping,
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead,
    loadMore,
  };
};
