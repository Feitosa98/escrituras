import React from 'react';
import '../../styles/index.css';

export function Card({
    children,
    title,
    subtitle,
    className = '',
    ...props
}) {
    return (
        <div className={`card ${className}`.trim()} {...props}>
            {(title || subtitle) && (
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    {title && <h3 className="text-lg font-semibold text-primary">{title}</h3>}
                    {subtitle && <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

export default Card;
