import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScrollText,
  Plus,
  Download,
  Users,
  FileText,
  Target,
  Settings,
  MoreHorizontal,
  TrendingUp,
  Globe,
  BookOpen,
  BriefcaseBusiness,
  Columns3,
} from 'lucide-react';
import { escriturasAPI } from '../../services/api';

// Paleta do sidebar — navy escuro fixo (independente do tema)
const NAV = {
  bg:          '#0f172a',
  bgHover:     '#1e293b',
  bgActive:    '#1e3a5f',
  border:      'rgba(255,255,255,0.06)',
  text:        'rgba(255,255,255,0.55)',
  textHover:   'rgba(255,255,255,0.85)',
  textActive:  '#ffffff',
  gold:        '#d4a843',
  goldLight:   '#f0c060',
  accent:      '#3b82f6',
  accentLight: 'rgba(59,130,246,0.15)',
  divider:     'rgba(255,255,255,0.08)',
  label:       'rgba(255,255,255,0.3)',
};

const ROLE_LABEL = {
  admin:        'ADM',
  editor:       'COORDENADOR',
  visualizador: 'ESCREVENTE',
};

// Iniciais do nome
function initials(nome) {
  if (!nome) return '??';
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function Sidebar({ userRole, user }) {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    escriturasAPI.getStats()
      .then(s => setTotal(s.total))
      .catch(() => {});
  }, []);

  const roleHierarchy = { admin: 3, editor: 2, visualizador: 1 };
  const hasPermission  = (req) => (roleHierarchy[userRole] || 0) >= (roleHierarchy[req] || 0);

  const mainItems = [
    { id: '/', label: 'Meu trabalho', icon: BriefcaseBusiness, permission: 'visualizador', exact: true },
    { id: '/visao-geral', label: 'Visão geral', icon: LayoutDashboard, permission: 'visualizador' },
    { id: '/listagem', label: 'Escrituras', icon: ScrollText,   permission: 'visualizador', badge: total },
    { id: '/cadastro', label: 'Nova Escritura', icon: Plus,     permission: 'editor' },
    { id: '/exportar', label: 'Relatórios', icon: TrendingUp,   permission: 'visualizador' },
    { id: '/metas',    label: 'Metas',      icon: Target,       permission: 'visualizador' },
    { id: '/consulta', label: 'Acompanhamento', icon: Globe },
  ];

  const adminItems = [
    { id: '/workflow', label: 'Visão por etapas', icon: Columns3, permission: 'editor' },
    { id: '/usuarios',       label: 'Equipe',       icon: Users,    permission: 'admin' },
    { id: '/tipos-escritura',label: 'Tipos',         icon: FileText, permission: 'editor' },
    { id: '/escreventes',    label: 'Escreventes',   icon: BookOpen, permission: 'admin' },
    { id: '/auditoria',      label: 'Auditoria',     icon: Settings, permission: 'admin' },
  ];

  const visibleMain  = mainItems.filter(i => hasPermission(i.permission));
  const visibleAdmin = adminItems.filter(i => hasPermission(i.permission));

  return (
    <aside
      style={{
        width: '15rem',
        flexShrink: 0,
        background: NAV.bg,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 40,
        borderRight: `1px solid ${NAV.border}`,
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '1.125rem 1rem 1rem',
          borderBottom: `1px solid ${NAV.divider}`,
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Monograma CS — fundo navy blendado em container escurinho */}
        <img
          src="/logo-mark.jpg"
          alt="CS"
          style={{
            width: '2.625rem',
            height: '2.625rem',
            flexShrink: 0,
            borderRadius: '0.4rem',
            objectFit: 'cover',
            objectPosition: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          }}
        />

        {/* Texto com a fonte romana oficial Cinzel */}
        <div style={{ lineHeight: 1 }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: NAV.gold,
              lineHeight: 1.15,
              fontFamily: '"Cinzel", "Times New Roman", serif',
            }}
          >
            Cartório<br />Santiago
          </div>
          <div
            style={{
              fontSize: '0.525rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.85)',
              marginTop: '0.2rem',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Gestão Notarial
          </div>
        </div>
      </div>


      {/* ── Menu principal ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '0.875rem 0.625rem 0.5rem' }}>
        <p
          style={{
            fontSize: '0.5625rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: NAV.label,
            padding: '0 0.625rem',
            marginBottom: '0.375rem',
          }}
        >
          Escritório
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {visibleMain.map(item => (
            <MenuLink key={item.id} item={item} />
          ))}
        </nav>

        {/* ── Seção admin ─────────────────────────────────────────────────── */}
        {visibleAdmin.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <p
              style={{
                fontSize: '0.5625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: NAV.label,
                padding: '0 0.625rem',
                marginBottom: '0.375rem',
              }}
            >
              Administração
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {visibleAdmin.map(item => (
                <MenuLink key={item.id} item={item} />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* ── Configurações ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 0.625rem 0.5rem' }}>
        <NavLink
          to="/auditoria"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            color: isActive ? NAV.textActive : NAV.text,
            background: isActive ? NAV.bgActive : 'transparent',
            transition: 'all 0.15s ease',
            fontSize: '0.8125rem',
            fontWeight: 500,
          })}
          onMouseEnter={e => {
            e.currentTarget.style.background = NAV.bgHover;
            e.currentTarget.style.color = NAV.textHover;
          }}
          onMouseLeave={e => {
            const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
            e.currentTarget.style.background = isActive ? NAV.bgActive : 'transparent';
            e.currentTarget.style.color = isActive ? NAV.textActive : NAV.text;
          }}
        >
          <Settings size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
          <span>Configurações</span>
        </NavLink>
      </div>

      {/* ── Perfil do usuário ─────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderTop: `1px solid ${NAV.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '9999px',
            background: `linear-gradient(135deg, ${NAV.accent}, #6366f1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '0.025em',
          }}
        >
          {initials(user?.nome)}
        </div>

        {/* Nome + cargo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: NAV.textActive,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.nome || 'Usuário'}
          </p>
          <p
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: NAV.gold,
              marginTop: '0.0625rem',
            }}
          >
            {ROLE_LABEL[user?.role] || user?.role || '—'}
          </p>
        </div>

        {/* Mais opções */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: NAV.text,
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem',
            borderRadius: '0.375rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = NAV.textActive}
          onMouseLeave={e => e.currentTarget.style.color = NAV.text}
          title="Opções"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>
    </aside>
  );
}

// ── Componente de link de menu ────────────────────────────────────────────────
function MenuLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.id}
      end={item.exact}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5625rem 0.75rem',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        fontWeight: isActive ? 600 : 400,
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        color: isActive ? NAV.textActive : NAV.text,
        background: isActive ? NAV.bgActive : 'transparent',
        position: 'relative',
      })}
      onMouseEnter={e => {
        const link = e.currentTarget;
        if (!link.classList.contains('active') && link.getAttribute('aria-current') !== 'page') {
          link.style.background = NAV.bgHover;
          link.style.color = NAV.textHover;
        }
      }}
      onMouseLeave={e => {
        const link = e.currentTarget;
        if (link.getAttribute('aria-current') !== 'page') {
          link.style.background = 'transparent';
          link.style.color = NAV.text;
        }
      }}
    >
      {({ isActive }) => (
        <>
          {/* Barra lateral ativa */}
          {isActive && (
            <div
              style={{
                position: 'absolute',
                left: 0, top: '15%', bottom: '15%',
                width: '3px',
                background: `linear-gradient(180deg, #d4a843, #f0c060)`,
                borderRadius: '0 3px 3px 0',
              }}
            />
          )}

          <Icon
            size={16}
            style={{
              flexShrink: 0,
              opacity: isActive ? 1 : 0.6,
              color: isActive ? '#d4a843' : 'inherit',
            }}
          />

          <span style={{ flex: 1 }}>{item.label}</span>

          {/* Badge de contagem */}
          {item.badge != null && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                background: isActive ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.1)',
                color: isActive ? '#d4a843' : 'rgba(255,255,255,0.5)',
                border: isActive ? '1px solid rgba(212,168,67,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '9999px',
                padding: '0.1rem 0.45rem',
                minWidth: '1.5rem',
                textAlign: 'center',
              }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default Sidebar;
