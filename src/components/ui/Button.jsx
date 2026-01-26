import React from 'react';
import '../../styles/index.css';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    icon: Icon,
    ...props
}) {
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';

    return (
        <button
            type={type}
            className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
            {children}
        </button>
    );
}

export default Button;
