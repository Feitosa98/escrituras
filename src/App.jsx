import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { ToastProvider, useToast } from './components/ui/Toast';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { isAuthenticated, getUser, hasPermission, authAPI, escriturasAPI } from './services/api';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Listagem from './pages/Listagem';
import Kanban from './pages/Kanban';
import Cadastro from './pages/Cadastro';
import Importar from './pages/Importar';
import Exportar from './pages/Exportar';
import Detalhes from './pages/Detalhes';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import Auditoria from './pages/Auditoria';
import TiposEscritura from './pages/admin/TiposEscritura';
import { Escreventes } from './pages/admin/Escreventes';
import { Metas } from './pages/Metas';
import Consulta from './pages/Consulta';
import LegalPage from './pages/LegalPage';
import './styles/index.css';

function AppContent() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [user, setUser] = useState(getUser());

  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [escrituraEdit, setEscrituraEdit] = useState(null);
  const [escrituraView, setEscrituraView] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      authAPI
        .me()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          authAPI.logout();
          setAuthenticated(false);
          setUser(null);
          navigate('/');
        });
    }
  }, []);

  useKeyboardShortcuts(
    authenticated
      ? {
          'ctrl+n': () => {
            if (hasPermission('editor')) {
              setEscrituraEdit(null);
              navigate('/cadastro');
              toast.info('Nova escritura (Ctrl+N)');
            }
          },
          'ctrl+l': () => {
            navigate('/listagem');
            toast.info('Listagem (Ctrl+L)');
          },
          'ctrl+d': () => {
            navigate('/');
            toast.info('Dashboard (Ctrl+D)');
          },
          'ctrl+i': () => {
            if (hasPermission('editor')) {
              navigate('/importar');
              toast.info('Importar (Ctrl+I)');
            }
          },
          'ctrl+e': () => {
            navigate('/exportar');
            toast.info('Exportar (Ctrl+E)');
          },
        }
      : {}
  );

  function handleLoginSuccess(userData) {
    setUser(userData);
    setAuthenticated(true);
    navigate('/');
    toast.success(`Bem-vindo, ${userData.nome}!`);
  }

  function handleLogout() {
    authAPI.logout();
    setAuthenticated(false);
    setUser(null);
    navigate('/');
    toast.info('Logout realizado com sucesso');
  }

  function toggleTheme() {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    const themeValue = newTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeValue);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', themeValue);
  }

  function handleEdit(escritura) {
    if (!hasPermission('editor')) {
      toast.error('Você não tem permissão para editar escrituras');
      return;
    }
    setEscrituraEdit(escritura);
    navigate('/cadastro');
  }

  async function handleView(escritura) {
    try {
      const completa = await escriturasAPI.getById(escritura.uuid || escritura.id);
      setEscrituraView(completa);
    } catch {
      setEscrituraView(escritura);
    }
    navigate('/detalhes');
  }

  function handleSaveSuccess() {
    setRefreshKey((prev) => prev + 1);
    navigate('/listagem');
    setEscrituraEdit(null);
  }

  function handleImportSuccess() {
    setRefreshKey((prev) => prev + 1);
    navigate('/listagem');
    toast.success('Dados importados! Redirecionando para listagem...');
  }

  // Rota pública: página de consulta de protocolo (sem login)
  // Com HashRouter, useLocation() já retorna o pathname correto (/consulta)
  if (location.pathname === '/consulta') {
    return <Consulta />;
  }

  const legalType = location.pathname.slice(1);
  if (['termos', 'privacidade', 'lgpd'].includes(legalType)) {
    return <LegalPage type={legalType} />;
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden font-sans ${isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Decorative blobs - fixed */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 ${isDarkTheme ? 'bg-blue-900' : 'bg-blue-200'}`} />
        <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 ${isDarkTheme ? 'bg-indigo-900' : 'bg-indigo-200'}`} />
      </div>

      {/* Header - fixed top */}
      <Header
        toggleTheme={toggleTheme}
        isDark={isDarkTheme}
        user={user}
        onLogout={handleLogout}
      />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar userRole={user?.role} user={user} />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', padding: '1.5rem 2rem' }}>
            <Routes>
              <Route path="/" element={<Dashboard key={refreshKey} />} />
              <Route
                path="/listagem"
                element={<Listagem key={refreshKey} onEdit={handleEdit} onView={handleView} />}
              />
              <Route path="/workflow" element={<Kanban key={refreshKey} />} />
              <Route
                path="/cadastro"
                element={
                  hasPermission('editor') ? (
                    <Cadastro escritura={escrituraEdit} onSaveSuccess={handleSaveSuccess} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/importar"
                element={
                  hasPermission('editor') ? (
                    <Importar onImportSuccess={handleImportSuccess} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="/exportar" element={<Exportar />} />
              <Route
                path="/detalhes"
                element={
                  <Detalhes
                    escritura={escrituraView}
                    onEdit={handleEdit}
                    onClose={() => navigate('/listagem')}
                  />
                }
              />
              <Route
                path="/usuarios"
                element={
                  hasPermission('admin') ? <GerenciarUsuarios /> : <Navigate to="/" replace />
                }
              />
              <Route
                path="/tipos-escritura"
                element={hasPermission('editor') ? <TiposEscritura /> : <Navigate to="/" replace />}
              />
              <Route
                path="/escreventes"
                element={hasPermission('admin') ? <Escreventes /> : <Navigate to="/" replace />}
              />
              <Route
                path="/auditoria"
                element={hasPermission('admin') ? <Auditoria /> : <Navigate to="/" replace />}
              />
              <Route path="/metas" element={<Metas />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/consulta" element={<Consulta />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
