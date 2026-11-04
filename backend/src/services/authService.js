import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: La variable de entorno JWT_SECRET no está configurada.');
}

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

class AuthService {
  async register(data) {
    const { email, password, full_name, phone, company, position, role } = data;

    if (!email || !password || !full_name) {
      throw new Error('Email, password y nombre completo son obligatorios.');
    }

    // El registro público es EXCLUSIVAMENTE para clientes externos (B2B).
    // Los roles internos y administrativos solo pueden ser creados por un SUPER_ADMIN en /api/users.
    const targetRole = 'CLIENT';

    // Validación de complejidad de contraseña (mín 8 chars, 1 mayúscula, 1 número, 1 especial)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.');
    }

    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Si el rol es CLIENT (registro web), nace inactivo para requerir validación B2B
    const is_active = false;

    const newUser = await userModel.create({
      email, password_hash, full_name,
      phone, company, position, role: targetRole,
      is_active
    });

    return newUser;
  }

  async login(email, password) {
    // Rate limiting
    const attemptKey = email.toLowerCase();
    const record = loginAttempts.get(attemptKey);

    if (record && record.count >= MAX_LOGIN_ATTEMPTS) {
      const timeSinceLock = Date.now() - record.lockedAt;
      if (timeSinceLock < LOCKOUT_DURATION_MS) {
        const minutesLeft = Math.ceil((LOCKOUT_DURATION_MS - timeSinceLock) / 60000);
        throw new Error(`Cuenta bloqueada por ${minutesLeft} minuto(s). Demasiados intentos fallidos.`);
      } else {
        loginAttempts.delete(attemptKey);
      }
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      this._registerFailedAttempt(attemptKey);
      throw new Error('Credenciales inválidas.');
    }

    if (!user.is_active) {
      if (user.role === 'CLIENT') {
        throw new Error('Su solicitud de cuenta está en proceso de validación por nuestro equipo comercial.');
      } else {
        throw new Error('Su cuenta de empleado ha sido desactivada por el administrador.');
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      this._registerFailedAttempt(attemptKey);
      throw new Error('Credenciales inválidas.');
    }

    loginAttempts.delete(attemptKey);

    if (user.mfa_enabled) {
      // MFA está activado para este usuario, requerir verificación
      return { mfaRequired: true, userId: user.id, email: user.email };
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mfa_enabled: user.mfa_enabled
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      company: user.company,
      position: user.position,
      role: user.role,
      avatar_url: user.avatar_url,
      mfa_enabled: user.mfa_enabled
    };

    return { token, user: userProfile };
  }

  _registerFailedAttempt(key) {
    const record = loginAttempts.get(key) || { count: 0, lockedAt: null };
    record.count += 1;
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      record.lockedAt = Date.now();
    }
    loginAttempts.set(key, record);
  }
}

export default new AuthService();
