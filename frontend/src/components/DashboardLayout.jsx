import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  LayoutDashboard, ShieldAlert, Users, Package, Store, FileText,
  LogOut, Bell, Search, BrainCircuit
} from 'lucide-react';
import DewateringChatbot from './DewateringChatbot.jsx';

const navItems = [
  { section: 'Principal', items: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  ]},
  { section: 'CRM / Comercial', items: [
    { label: 'Solicitudes Web', icon: Users, path: '/admin/requests', roles: ['SUPER_ADMIN', 'OPERATOR'] },
    { label: 'Gestión Cotizaciones', icon: FileText, path: '/admin/quotations', roles: ['SUPER_ADMIN', 'OPERATOR'] },
  ]},
  { section: 'Operaciones', items: [
    { label: 'Inventario', icon: Package, path: '/inventory', roles: ['SUPER_ADMIN', 'OPERATOR'] },
    { label: 'Sucursales', icon: Store, path: '/stores', roles: ['SUPER_ADMIN', 'OPERATOR'] },
  ]},
  { section: 'Área del Cliente', items: [
    { label: 'Mis Proyectos', icon: Store, path: '/client/projects', roles: ['CLIENT'] },
    { label: 'Mis Cotizaciones', icon: FileText, path: '/client/quotations', roles: ['CLIENT'] },
    { label: 'Mis Documentos', icon: Package, path: '/client/documents', roles: ['CLIENT'] },
  ]},
  { section: 'Configuración', items: [
    { label: 'Centro Entrenamiento IA', icon: BrainCircuit, path: '/ai-training', roles: ['SUPER_ADMIN'] },
    { label: 'Aprobación Clientes', icon: ShieldAlert, path: '/approvals', roles: ['SUPER_ADMIN'] },
    { label: 'Auditoría', icon: ShieldAlert, path: '/audit', roles: ['SUPER_ADMIN'] },
    { label: 'Roles y Usuarios', icon: Users, path: '/roles', roles: ['SUPER_ADMIN'] },
  ]},
];

const DashboardLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole, primaryRole } = useAuth();

  // Reset scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Obtener iniciales del usuario para el avatar
  const initials = user?.nombre_completo 
    ? user.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  // Filtrar items de nav según los roles del usuario
  const filteredNavItems = navItems.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || hasRole(item.roles))
  })).filter(group => group.items.length > 0);

  // Color del badge de rol
  const roleColors = {
    SUPER_ADMIN: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    OPERATOR: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' },
    CLIENT: { bg: 'rgba(10,185,129,0.1)', color: '#10b981' },
  };
  const roleBadge = roleColors[primaryRole] || { bg: 'rgba(100,100,100,0.08)', color: 'var(--text-secondary)' };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ padding: '2rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
          <img className="logo-dynamic" src="/logodewatering.png" alt="Dewatering Solutions" style={{ width: '220px', height: 'auto', maxHeight: '120px', objectFit: 'contain', transform: 'scale(1.3)', dropShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        </div>
        <nav className="sidebar-nav">
          {filteredNavItems.map(group => (
            <React.Fragment key={group.section}>
              <span className="sidebar-section-label">{group.section}</span>
              {group.items.map(item => (
                <button key={item.path}
                  className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}>
                  <item.icon size={18}/> {item.label}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-footer">
          {/* Perfil resumido del usuario */}
          <div 
            onClick={() => navigate('/profile')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', 
              padding: '0.75rem 0.85rem', marginBottom: '0.5rem',
              borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-light)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-light)'}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(54,124,252,0.25)'
            }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ 
                fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0
              }}>{user?.nombre_completo || user?.email || 'Usuario'}</p>
              <span style={{ 
                display: 'inline-flex', padding: '0.1rem 0.4rem', borderRadius: '100px',
                fontSize: '0.65rem', fontWeight: 600,
                backgroundColor: roleBadge.bg, color: roleBadge.color
              }}>{primaryRole || 'Sin rol'}</span>
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut size={18}/> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>{title || 'Dashboard'}</h1>
            <p>{subtitle || new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="topbar-right">
            <button className="btn-ghost" title="Buscar" style={{ width: 38, height: 38 }}><Search size={18}/></button>
            <button className="btn-ghost" title="Notificaciones" style={{ width: 38, height: 38, position: 'relative' }}>
              <Bell size={18}/>
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-gradient)' }}></span>
            </button>
            <div 
              onClick={() => navigate('/profile')}
              title="Mi Perfil"
              style={{
                width: 38, height: 38, borderRadius: '12px',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(54,124,252,0.25)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >{initials}</div>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </main>

      {/* RAG Chatbot Widget */}
      <DewateringChatbot />
    </div>
  );
};

export default DashboardLayout;
