/**
 * Message Queue Hook
 * Stores pending messages for offline scenarios and retries on reconnection
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/socket-context';

interface QueuedMessage {
  tempId: string;
  chatId: string;
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'chat_message_queue';
const MAX_QUEUE_SIZE = 50;

// Load queue from localStorage
const loadQueue = (): QueuedMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save queue to localStorage
const saveQueue = (queue: QueuedMessage[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // localStorage might be full or disabled
  }
};

export const useMessageQueue = () => {
  const { socket, isConnected } = useSocket();
  const [queue, setQueue] = useState<QueuedMessage[]>(loadQueue);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Add message to queue
  const enqueue = useCallback((chatId: string, content: string): string => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const message: QueuedMessage = {
      tempId,
      chatId,
      content,
      timestamp: Date.now(),
    };

    setQueue((prev) => {
      const next = [...prev, message];
      saveQueue(next);
      return next;
    });

    return tempId;
  }, []);

  // Remove message from queue (on successful delivery)
  const dequeue = useCallback((tempId: string): void => {
    setQueue((prev) => {
      const next = prev.filter((m) => m.tempId !== tempId);
      saveQueue(next);
      return next;
    });
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(tempId);
      return next;
    });
  }, []);

  // Get pending messages for a chat
  const getPendingForChat = useCallback(
    (chatId: string): QueuedMessage[] => {
      return queue.filter((m) => m.chatId === chatId);
    },
    [queue]
  );

  // Process queue when connection is restored
  useEffect(() => {
    if (!socket || !isConnected || queue.length === 0) return;

    // Process messages that aren't already being processed
    queue.forEach((message) => {
      if (processingIds.has(message.tempId)) return;

      setProcessingIds((prev) => new Set(prev).add(message.tempId));

      socket.emit(
        'send-message',
        {
          chatId: message.chatId,
          content: message.content,
          tempId: message.tempId,
        },
        (response: { success: boolean; messageId?: string; error?: string } | null) => {
          if (response?.success) {
            dequeue(message.tempId);
          } else {
            // Failed, will retry on next connection
            setProcessingIds((prev) => {
              const next = new Set(prev);
              next.delete(message.tempId);
              return next;
            });
          }
        }
      );
    });
  }, [socket, isConnected, queue, processingIds, dequeue]);

  return {
    queue,
    enqueue,
    dequeue,
    getPendingForChat,
    queueSize: queue.length,
  };
};
