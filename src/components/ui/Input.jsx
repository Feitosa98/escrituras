import React from 'react';
import '../../styles/index.css';

export function Input({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-sm ${className}`.trim()}>
      {label && (
        <label className="label">
          {label}
          {required && <span style={{ color: 'var(--danger-500)' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      />
      {error && (
        <span className="text-sm" style={{ color: 'var(--danger-500)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
