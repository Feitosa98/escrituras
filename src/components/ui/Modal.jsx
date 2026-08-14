import React from 'react';
import '../../styles/index.css';

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', ...props }) {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1000px' },
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal-backdrop)',
          padding: 'var(--spacing-lg)',
        }}
      >
        <div
          className="card slide-down"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            ...sizeStyles[size],
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            zIndex: 'var(--z-modal)',
          }}
          {...props}
        >
          {title && (
            <div
              className="flex justify-between items-center"
              style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <h2 className="text-xl font-semibold text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="btn btn-secondary btn-sm"
                style={{ padding: 'var(--spacing-xs)' }}
              >
                ✕
              </button>
            </div>
          )}

          <div>{children}</div>

          {footer && (
            <div
              style={{
                marginTop: 'var(--spacing-lg)',
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: 'var(--spacing-md)',
                justifyContent: 'flex-end',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Modal;
