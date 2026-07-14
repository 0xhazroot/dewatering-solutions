import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/**
 * Decodifica un JWT sin librerías externas (solo la parte del payload).
 * No verifica la firma — eso lo hace el backend.
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Verifica si un token JWT ha expirado
 */
const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicializar desde localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem('dewatering_token');
    if (storedToken && !isTokenExpired(storedToken)) {
      const decoded = decodeJWT(storedToken);
      setToken(storedToken);
      const userId = decoded.userId;
      const roleOrRoles = decoded.role || decoded.roles;
      const parsedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : (roleOrRoles ? [roleOrRoles] : []);
      setUser({
        id: userId,
        userId: userId,
        email: decoded.email,
        roles: parsedRoles,
        mfa_enabled: decoded.mfa_enabled
      });
      setIsAuthenticated(true);
    } else {
      // Token expirado o inexistente — limpiar
      localStorage.removeItem('dewatering_token');
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('dewatering_token', newToken);
    setToken(newToken);
    
    // Priorizar datos del response del backend; fallback a decodificar JWT
    const decoded = decodeJWT(newToken);
    const userId = userData?.id || decoded?.userId;
    const roleOrRoles = userData?.role || decoded?.role || userData?.roles || decoded?.roles;
    const parsedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : (roleOrRoles ? [roleOrRoles] : []);

    setUser({
      id: userId,
      userId: userId,
      email: userData?.email || decoded?.email,
      nombre_completo: userData?.full_name || userData?.nombre_completo || decoded?.nombre_completo || '',
      company: userData?.company || decoded?.company || '',
      roles: parsedRoles,
      mfa_enabled: userData?.mfa_enabled || decoded?.mfa_enabled
    });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dewatering_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Verificar si el usuario tiene al menos uno de los roles dados
   * @param {string[]} requiredRoles 
   */
  const hasRole = useCallback((requiredRoles) => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => requiredRoles.includes(role));
  }, [user]);

  /**
   * Obtener el rol principal (mayor privilegio)
   */
  const primaryRole = user?.roles?.includes('SUPER_ADMIN') ? 'SUPER_ADMIN'
    : user?.roles?.includes('OPERATOR') ? 'OPERATOR'
    : user?.roles?.includes('CLIENT') ? 'CLIENT'
    : null;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loading,
      login,
      logout,
      hasRole,
      primaryRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para consumir el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
