import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: La variable de entorno JWT_SECRET no está configurada.');
}

export const requireAuth = (req, res, next) => {
  // 1. Extraer el token de las cabeceras (Formato esperado: "Bearer <token>")
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Acceso denegado. Se requiere un token de autenticación (JWT) válido en el header Authorization.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verificar la firma criptográfica del token y su tiempo de vida (expiración)
    const decodedPayload = jwt.verify(token, JWT_SECRET);

    // 3. Inyectar la identidad del usuario en el objeto Request (req.user)
    // Esto es vital para el ABAC posterior: sabremos qué usuario (y de qué tienda) está haciendo la petición.
    req.user = decodedPayload;

    // 4. Ceder el control al siguiente middleware o al controlador final
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Su sesión ha expirado (TokenExpiredError). Por favor, inicie sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token de autenticación inválido o corrupto.' });
  }
};
