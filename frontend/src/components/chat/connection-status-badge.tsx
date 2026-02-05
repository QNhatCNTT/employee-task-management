/**
 * Connection Status Badge
 * Displays socket connection status: connected (green), reconnecting (yellow), disconnected (red)
 */

import { useSocket } from '../../contexts/socket-context';
import { ConnectionStatus } from '../../types/chat-types';

interface ConnectionStatusBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export const ConnectionStatusBadge = ({
  className = '',
  showLabel = true,
}: ConnectionStatusBadgeProps) => {
  const { isConnected } = useSocket();

  // Determine connection status
  const status: ConnectionStatus = isConnected ? 'connected' : 'disconnected';

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      label: 'Connected',
      pulse: false,
    },
    connecting: {
      color: 'bg-yellow-500',
      label: 'Connecting...',
      pulse: true,
    },
    disconnected: {
      color: 'bg-red-500',
      label: 'Disconnected',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`w-2.5 h-2.5 rounded-full ${config.color} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
        aria-label={config.label}
      />
      {showLabel && (
        <span className="text-xs text-gray-500">{config.label}</span>
      )}
    </div>
  );
};
