import { useState, useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface ToastProps {
    children: ReactNode;
    variant?: "default" | "destructive" | "success";
    onClose?: () => void;
}

export function Toast({ children, variant = "default", onClose }: ToastProps) {
    const variants = {
        default: "bg-gray-900 text-white",
        destructive: "bg-red-600 text-white",
        success: "bg-green-600 text-white",
    };

    return (
        <div className={`${variants[variant]} rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]`}>
            <div className="flex-1">{children}</div>
            {onClose && (
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

interface ToastItem {
    id: string;
    children: ReactNode;
    variant?: "default" | "destructive" | "success";
}

export function Toaster() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        // This is a simple toaster implementation
        // In production, use a proper state management solution
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} variant={toast.variant}>
                    {toast.children}
                </Toast>
            ))}
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = (children: ReactNode, variant: "default" | "destructive" | "success" = "default") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, children, variant }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    return {
        toast: addToast,
        toasts,
    };
}
