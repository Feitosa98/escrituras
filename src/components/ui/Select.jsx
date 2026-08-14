import React from 'react';
import '../../styles/index.css';

export function Select({
  label,
  error,
  options = [],
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Selecione...',
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
      <select
        className="input"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={typeof option === 'object' ? option.value : option}>
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-sm" style={{ color: 'var(--danger-500)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Select;
