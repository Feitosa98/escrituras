import React from 'react';
import { LayoutDashboard, List, Plus, Upload, Download, Users, FileText, Target } from 'lucide-react';
import '../../styles/index.css';

export function Sidebar({ currentPage, onPageChange, userRole }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'visualizador' },
        { id: 'listagem', label: 'Listagem', icon: List, permission: 'visualizador' },
        { id: 'cadastro', label: 'Nova Escritura', icon: Plus, permission: 'editor' },
        { id: 'importar', label: 'Importar', icon: Upload, permission: 'editor' },
        { id: 'exportar', label: 'Exportar', icon: Download, permission: 'visualizador' }
    ];

    const adminItems = [
        { id: 'usuarios', label: 'Usuários', icon: Users, permission: 'admin' },
        { id: 'tipos-escritura', label: 'Tipos de Escritura', icon: FileText, permission: 'editor' }, // Editores podem ver/editar
        { id: 'metas', label: 'Metas', icon: Target, permission: 'visualizador' },
        { id: 'escreventes', label: 'Escreventes', icon: Users, permission: 'admin' },
        { id: 'auditoria', label: 'Auditoria', icon: FileText, permission: 'admin' }
    ];

    const roleHierarchy = {
        'admin': 3,
        'editor': 2,
        'visualizador': 1
    };

    const hasPermission = (requiredRole) => {
        return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
    };

    const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));
    const visibleAdminItems = adminItems.filter(item => hasPermission(item.permission));

    return (
        <aside style={{
            width: '250px',
            backgroundColor: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-color)',
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)'
        }}>
            <nav>
                {visibleMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-md)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isActive ? 'var(--primary-100)' : 'transparent',
                                color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? '600' : '400'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {visibleAdminItems.length > 0 && (
                <>
                    <div style={{
                        height: '1px',
                        backgroundColor: 'var(--border-color)',
                        margin: 'var(--spacing-md) 0'
                    }} />

                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <p className="text-xs text-secondary" style={{ padding: '0 var(--spacing-md)' }}>
                            ADMINISTRAÇÃO
                        </p>
                    </div>

                    <nav>
                        {visibleAdminItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onPageChange(item.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-md)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: isActive ? 'var(--primary-100)' : 'transparent',
                                        color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? '600' : '400'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </>
            )}
        </aside>
    );
}

export default Sidebar;
