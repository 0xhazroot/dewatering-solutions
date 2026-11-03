import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PublicLayout from './components/public/PublicLayout.jsx';
import { 
  NosotrosPage, ServiciosPage, ProductosPage, CapacitacionesPage, 
  ProyectosPage, DescargasPage, BlogPage, ContactoPage 
} from './pages/PublicPages.jsx';
import MfaPage from './pages/MfaPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import StoresPage from './pages/StoresPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import RolesPage from './pages/RolesPage.jsx';
import ApprovalsPage from './pages/ApprovalsPage.jsx';
import AITrainingPage from './pages/AITrainingPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LeadsPage from './pages/crm/LeadsPage.jsx';
import AdminRequestsPage from './pages/crm/AdminRequestsPage.jsx';
import AdminQuotationsPage from './pages/crm/AdminQuotationsPage.jsx';
import ClientModulePage from './pages/client/ClientModulePage.jsx';
import ClientProjectsPage from './pages/client/ClientProjectsPage.jsx';
import ClientQuotationsPage from './pages/client/ClientQuotationsPage.jsx';
import ClientDocumentsPage from './pages/client/ClientDocumentsPage.jsx';
import { Store, FileText, Package } from 'lucide-react';

/**
 * Protección de rutas con validación de JWT real.
 * Opcionalmente verifica roles específicos.
 */
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)', fontSize: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', animation: 'pulse 1.5s infinite'
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem' }}>M</span>
          </div>
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" />;

  // Verificación de rol opcional
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--bg-primary)',
        color: 'var(--danger)', fontSize: '1rem', textAlign: 'center', padding: '2rem'
      }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>🚫 Acceso Denegado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Su rol no tiene permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

const App = () => {
  useEffect(() => {
    // Forzamos el modo claro (light) en toda la aplicación
    document.body.classList.remove('dark');
  }, []);

  return (
    <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas (Sitio Web Corporativo) */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/nosotros" element={<PublicLayout><NosotrosPage /></PublicLayout>} />
            {/* Login, Registration, Recovery (Full Screen Auth Layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/servicios" element={<PublicLayout><ServiciosPage /></PublicLayout>} />
            <Route path="/productos" element={<PublicLayout><ProductosPage /></PublicLayout>} />
            <Route path="/capacitaciones" element={<PublicLayout><CapacitacionesPage /></PublicLayout>} />
            <Route path="/proyectos" element={<PublicLayout><ProyectosPage /></PublicLayout>} />
            <Route path="/descargas" element={<PublicLayout><DescargasPage /></PublicLayout>} />
            <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
            <Route path="/contacto" element={<PublicLayout><ContactoPage /></PublicLayout>} />

            {/* Autenticación MFA */}
            <Route path="/mfa" element={<MfaPage />} />
            
            {/* Rutas Protegidas — Acceso según RBAC */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OPERATOR']}><InventoryPage /></ProtectedRoute>} />
            <Route path="/stores" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OPERATOR']}><StoresPage /></ProtectedRoute>} />
            <Route path="/staff" element={<Navigate to="/roles" replace />} />
            <Route path="/audit" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN']}><AuditPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN']}><RolesPage /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN']}><ApprovalsPage /></ProtectedRoute>} />
            <Route path="/ai-training" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN']}><AITrainingPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            
            {/* Rutas Cliente Exclusivas */}
            <Route path="/client/projects" element={<ProtectedRoute requiredRoles={['CLIENT']}><ClientProjectsPage /></ProtectedRoute>} />
            <Route path="/client/quotations" element={<ProtectedRoute requiredRoles={['CLIENT']}><ClientQuotationsPage /></ProtectedRoute>} />
            <Route path="/client/documents" element={<ProtectedRoute requiredRoles={['CLIENT']}><ClientDocumentsPage /></ProtectedRoute>} />

            {/* Rutas CRM */}
            <Route path="/leads" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OPERATOR']}><LeadsPage /></ProtectedRoute>} />
            <Route path="/admin/requests" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OPERATOR']}><AdminRequestsPage /></ProtectedRoute>} />
            <Route path="/admin/quotations" element={<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OPERATOR']}><AdminQuotationsPage /></ProtectedRoute>} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
};

export default App;
