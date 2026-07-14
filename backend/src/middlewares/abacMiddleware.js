/**
 * Middleware ABAC (Attribute-Based Access Control)
 * 
 * Provee funciones reutilizables de verificación de atributos (tienda, campos, premium).
 * Se usa en conjunto con RBAC para lograr control de acceso granular.
 */

/**
 * Obtener el rol de mayor privilegio del usuario
 * Soporta tanto req.user.role (JWT singular) como req.user.roles (array)
 * Prioridad: SUPER_ADMIN > ADMIN > COMMERCIAL > ENGINEER > CLIENT
 */
export const getPrimaryRole = (user) => {
  if (!user) return null;
  const roles = user.roles || (user.role ? [user.role] : []);
  if (roles.length === 0) return null;

  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('OPERATOR')) return 'OPERATOR';
  if (roles.includes('CLIENT')) return 'CLIENT';
  return roles[0];
};

/**
 * Verificar si el usuario tiene jurisdicción sobre una tienda (ABAC Geográfico)
 * Admin y Super Admin tienen jurisdicción global.
 */
export const hasStoreJurisdiction = (user, targetTiendaId) => {
  if (!user) return false;
  const role = getPrimaryRole(user);
  if (role === 'SUPER_ADMIN') return true;
  return user.tiendaId !== undefined && user.tiendaId === targetTiendaId;
};

/**
 * Middleware: Bloquear acceso de solo lectura para Clientes o Auditores en áreas restringidas
 */
export const denyAuditorWrites = (req, res, next) => {
  const role = getPrimaryRole(req.user);
  if (role === 'CLIENT' || role === 'AUDITOR') {
    return res.status(403).json({
      error: 'ABAC Denegado: Su rol es estrictamente de solo lectura para esta operación.',
    });
  }
  next();
};

/**
 * Middleware: Restringir campos editables para Roles con privilegios intermedios (Comercial / Ingeniero)
 * @param {string[]} allowedFields - Campos que el rol puede modificar
 */
export const restrictEmployeeFields = (allowedFields) => {
  return (req, res, next) => {
    const role = getPrimaryRole(req.user);
    // Solo aplica la restricción a roles de empleado (Operador es el único empleado interno con restricciones)
    if (role !== 'OPERATOR') return next();

    const attemptedFields = Object.keys(req.body);
    const forbidden = attemptedFields.filter((f) => !allowedFields.includes(f));
    if (forbidden.length > 0) {
      return res.status(403).json({
        error: `ABAC Denegado: Su rol de empleado (${role}) solo puede actualizar los campos [${allowedFields.join(', ')}]. Campos bloqueados: [${forbidden.join(', ')}]`,
      });
    }
    next();
  };
};
