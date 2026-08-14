import React from 'react';
import '../../styles/index.css';

export function Loading({ size = 'md', message }) {
  const sizes = {
    sm: '24px',
    md: '40px',
    lg: '60px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-xl)',
      }}
    >
      <div
        className="loading"
        style={{
          width: sizes[size],
          height: sizes[size],
        }}
      />
      {message && <p className="text-sm text-secondary">{message}</p>}
    </div>
  );
}

export default Loading;
