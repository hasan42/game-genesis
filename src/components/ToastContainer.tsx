import { useState, useEffect, useCallback } from 'react';

export interface ToastItem {
  id: number;
  icon: string;
  title: string;
  description: string;
}

let toastIdCounter = 0;
const listeners: Array<(toast: ToastItem) => void> = [];

export function showToast(icon: string, title: string, description: string) {
  const toast: ToastItem = { id: ++toastIdCounter, icon, title, description };
  for (const listener of listeners) {
    listener(toast);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: ToastItem) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      const idx = listeners.indexOf(addToast);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-frost-900/95 border border-ice-700/60 rounded-lg px-4 py-3 shadow-lg shadow-ice-900/30 backdrop-blur-sm max-w-xs animate-slide-in"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{toast.icon}</span>
            <div>
              <div className="text-ice-200 font-serif font-bold text-sm">{toast.title}</div>
              <div className="text-frost-400 text-xs mt-0.5">{toast.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}