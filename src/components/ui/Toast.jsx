import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback(
    (message, duration) => addToast(message, 'success', duration),
    [addToast]
  );
  const error = useCallback(
    (message, duration) => addToast(message, 'error', duration),
    [addToast]
  );
  const warning = useCallback(
    (message, duration) => addToast(message, 'warning', duration),
    [addToast]
  );
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--spacing-xl)',
        right: 'var(--spacing-xl)',
        zIndex: 'var(--z-tooltip)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  const colors = {
    success: {
      bg: 'var(--success-50)',
      border: 'var(--success-500)',
      text: 'var(--success-700)',
      icon: 'var(--success-600)',
    },
    error: {
      bg: 'var(--danger-50)',
      border: 'var(--danger-500)',
      text: 'var(--danger-700)',
      icon: 'var(--danger-600)',
    },
    warning: {
      bg: 'var(--warning-50)',
      border: 'var(--warning-500)',
      text: 'var(--warning-700)',
      icon: 'var(--warning-600)',
    },
    info: {
      bg: 'var(--primary-50)',
      border: 'var(--primary-500)',
      text: 'var(--primary-700)',
      icon: 'var(--primary-600)',
    },
  };

  const style = colors[type];

  return (
    <div
      className="slide-up"
      style={{
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-md)',
        minWidth: '300px',
      }}
    >
      <div style={{ color: style.icon, flexShrink: 0 }}>{icons[type]}</div>
      <p
        style={{
          flex: 1,
          fontSize: 'var(--font-size-sm)',
          color: style.text,
          margin: 0,
        }}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: style.text,
          opacity: 0.7,
          transition: 'opacity var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.target.style.opacity = 1)}
        onMouseLeave={(e) => (e.target.style.opacity = 0.7)}
      >
        <X size={16} />
      </button>
    </div>
  );
}
