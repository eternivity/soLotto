import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  show: (type: ToastType, message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string, durationMs = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const item: ToastItem = { id, type, message, durationMs };
    setToasts(prev => [...prev, item]);
    window.setTimeout(() => remove(id), durationMs);
  }, [remove]);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (msg, d) => show('success', msg, d),
    error: (msg, d) => show('error', msg, d),
    info: (msg, d) => show('info', msg, d),
  }), [show]);

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success': return { border: 'border-green-500/40', bg: 'bg-green-900/30', text: 'text-green-200' };
      case 'error': return { border: 'border-red-500/40', bg: 'bg-red-900/30', text: 'text-red-200' };
      default: return { border: 'border-blue-500/40', bg: 'bg-blue-900/30', text: 'text-blue-200' };
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[1000] space-y-3 w-[90%] max-w-sm">
        {toasts.map(t => {
          const c = getColors(t.type);
          return (
            <div
              key={t.id}
              className={`flex items-start ${c.bg} border ${c.border} rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm`}
            >
              <div className="mr-3 mt-0.5">
                {t.type === 'success' && <span>✅</span>}
                {t.type === 'error' && <span>⚠️</span>}
                {t.type === 'info' && <span>ℹ️</span>}
              </div>
              <div className={`text-sm leading-5 ${c.text}`}>{t.message}</div>
              <button
                onClick={() => remove(t.id)}
                className="ml-4 text-gray-400 hover:text-white"
                aria-label="Close"
              >✖</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};




