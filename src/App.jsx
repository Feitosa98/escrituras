import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/ui/Toast';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { isAuthenticated, getUser, hasPermission, authAPI } from './services/api';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Listagem from './pages/Listagem';
import Cadastro from './pages/Cadastro';
import Importar from './pages/Importar';
import Exportar from './pages/Exportar';
import Detalhes from './pages/Detalhes';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import Auditoria from './pages/Auditoria';
import TiposEscritura from './pages/admin/TiposEscritura';
import { Escreventes } from './pages/admin/Escreventes';
import { Metas } from './pages/Metas';
import './styles/index.css';

function AppContent() {
  const toast = useToast();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [user, setUser] = useState(getUser());

  // Obter página atual da URL
  const getCurrentPageFromURL = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'dashboard';
    return path.substring(1); // Remove a barra inicial
  };

  const [currentPage, setCurrentPage] = useState(getCurrentPageFromURL());
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [escrituraEdit, setEscrituraEdit] = useState(null);
  const [escrituraView, setEscrituraView] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Aplicar tema salvo ao montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Sincronizar com mudanças de URL (botão voltar/avançar)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getCurrentPageFromURL());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Verificar autenticação ao montar
  useEffect(() => {
    if (authenticated) {
      // Verificar se o token ainda é válido
      authAPI.me()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, []);

  // Atalhos de teclado (apenas se autenticado)
  useKeyboardShortcuts(authenticated ? {
    'ctrl+n': () => {
      if (hasPermission('editor')) {
        setEscrituraEdit(null);
        setCurrentPage('cadastro');
        toast.info('Nova escritura (Ctrl+N)');
      }
    },
    'ctrl+l': () => {
      setCurrentPage('listagem');
      toast.info('Listagem (Ctrl+L)');
    },
    'ctrl+d': () => {
      setCurrentPage('dashboard');
      toast.info('Dashboard (Ctrl+D)');
    },
    'ctrl+i': () => {
      if (hasPermission('editor')) {
        setCurrentPage('importar');
        toast.info('Importar (Ctrl+I)');
      }
    },
    'ctrl+e': () => {
      setCurrentPage('exportar');
      toast.info('Exportar (Ctrl+E)');
    }
  } : {});

  function handleLoginSuccess(userData) {
    setUser(userData);
    setAuthenticated(true);
    setCurrentPage('dashboard');
    toast.success(`Bem-vindo, ${userData.nome}!`);
  }

  function handleLogout() {
    authAPI.logout();
    setAuthenticated(false);
    setUser(null);
    setCurrentPage('dashboard');
    toast.info('Logout realizado com sucesso');
  }

  function toggleTheme() {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    const themeValue = newTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeValue);
    localStorage.setItem('theme', themeValue);
  }

  function handlePageChange(page) {
    // Verificar permissões antes de mudar de página
    if (page === 'cadastro' && !hasPermission('editor')) {
      toast.error('Você não tem permissão para criar escrituras');
      return;
    }
    if (page === 'importar' && !hasPermission('editor')) {
      toast.error('Você não tem permissão para importar dados');
      return;
    }
    if ((page === 'usuarios' || page === 'auditoria' || page === 'tipos-escritura' || page === 'escreventes') && !hasPermission('admin')) {
      toast.error('Apenas administradores podem acessar esta página');
      return;
    }

    // Atualizar URL e estado
    const newPath = page === 'dashboard' ? '/' : `/${page}`;
    window.history.pushState({}, '', newPath);
    setCurrentPage(page);
    setEscrituraEdit(null);
    setEscrituraView(null);
  }

  function handleEdit(escritura) {
    if (!hasPermission('editor')) {
      toast.error('Você não tem permissão para editar escrituras');
      return;
    }
    setEscrituraEdit(escritura);
    window.history.pushState({}, '', '/cadastro');
    setCurrentPage('cadastro');
  }

  function handleView(escritura) {
    setEscrituraView(escritura);
    window.history.pushState({}, '', '/detalhes');
    setCurrentPage('detalhes');
  }

  function handleSaveSuccess() {
    setRefreshKey(prev => prev + 1);
    window.history.pushState({}, '', '/listagem');
    setCurrentPage('listagem');
    setEscrituraEdit(null);
  }

  function handleImportSuccess() {
    setRefreshKey(prev => prev + 1);
    window.history.pushState({}, '', '/listagem');
    setCurrentPage('listagem');
    toast.success('Dados importados! Redirecionando para listagem...');
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} />;

      case 'listagem':
        return <Listagem key={refreshKey} onEdit={handleEdit} onView={handleView} />;

      case 'cadastro':
        return <Cadastro escritura={escrituraEdit} onSaveSuccess={handleSaveSuccess} />;

      case 'importar':
        return <Importar onImportSuccess={handleImportSuccess} />;

      case 'exportar':
        return <Exportar />;

      case 'detalhes':
        return <Detalhes escritura={escrituraView} onEdit={handleEdit} onClose={() => setCurrentPage('listagem')} />;

      case 'usuarios':
        return <GerenciarUsuarios />;

      case 'tipos-escritura':
        return <TiposEscritura />;

      case 'escreventes':
        return <Escreventes />;

      case 'auditoria':
        return <Auditoria />;

      case 'metas':
        return <Metas />;

      default:
        return <Dashboard key={refreshKey} />;
    }
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        toggleTheme={toggleTheme}
        isDark={isDarkTheme}
        user={user}
        onLogout={handleLogout}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          userRole={user?.role}
        />

        <main style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {renderPage()}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
