import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Types
interface ToastItem {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, variant?: ToastItem['variant'], duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Component
const Toast = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const variants = {
    success: {
      bg: 'bg-green-600',
      icon: <CheckCircle size={20} />,
    },
    error: {
      bg: 'bg-red-600',
      icon: <AlertCircle size={20} />,
    },
    info: {
      bg: 'bg-blue-600',
      icon: <Info size={20} />,
    },
  };

  const { bg, icon } = variants[toast.variant];

  return (
    <div
      className={`${bg} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px] max-w-[420px] animate-slide-in`}
      role="alert"
    >
      <span className="flex-shrink-0">{icon}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Provider Component
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastItem['variant'] = 'info', duration = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  );

  const error = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  const info = useCallback(
    (message: string) => showToast(message, 'info'),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
