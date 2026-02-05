/**
 * Presence Hook
 * Tracks online/offline status of users via socket events
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/socket-context';
import { PresenceUpdate } from '../types/chat-types';

export const usePresence = () => {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    // User came online
    const handleUserOnline = (data: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    };

    // User went offline
    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    // Generic presence update
    const handlePresenceUpdate = (data: PresenceUpdate) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    };

    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('presence-update', handlePresenceUpdate);

    return () => {
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('presence-update', handlePresenceUpdate);
    };
  }, [socket]);

  // Check if specific user is online
  const isOnline = useCallback(
    (userId: string): boolean => onlineUsers.has(userId),
    [onlineUsers]
  );

  // Fetch online status for multiple users
  const fetchOnlineStatus = useCallback(
    (userIds: string[]): Promise<string[]> => {
      return new Promise((resolve) => {
        if (!socket || !isConnected) {
          resolve([]);
          return;
        }

        socket.emit('get-online-users', { userIds }, (response: { onlineUsers: string[] } | null) => {
          const online = response?.onlineUsers || [];
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            online.forEach((id: string) => next.add(id));
            return next;
          });
          resolve(online);
        });
      });
    },
    [socket, isConnected]
  );

  return {
    onlineUsers: Array.from(onlineUsers),
    isOnline,
    fetchOnlineStatus,
  };
};
