import React from 'react';
import '../../styles/index.css';

export function Badge({ children, variant = 'primary', className = '', ...props }) {
  const variantClass = `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export default Badge;
