import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import auditService from '../services/auditService.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: La variable de entorno JWT_SECRET no está configurada.');
}

export const setupMfa = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await userModel.findById(userId);

    // Generar un nuevo secreto TOTP
    const secret = speakeasy.generateSecret({
      name: `Dewatering Solutions (${user.email})`
    });

    // Guardar el secreto en la base de datos de forma temporal (no habilitado aún)
    await userModel.update(userId, { mfa_secret: secret.base32 });

    // Generar el código QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({ qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    next(error);
  }
};

export const verifySetupMfa = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    const secret = await userModel.getMfaSecret(userId);

    if (!secret) {
      return res.status(400).json({ error: 'MFA no está configurado.' });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      // Activar MFA en la base de datos
      await userModel.update(userId, { mfa_enabled: true });
      await auditService.log(req, 'MFA_ENABLED', 'USER', userId, null, { action: 'MFA Setup Complete' });
      res.json({ message: 'MFA activado exitosamente.' });
    } else {
      res.status(400).json({ error: 'Código incorrecto. Intente de nuevo.' });
    }
  } catch (error) {
    next(error);
  }
};

export const disableMfa = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await userModel.update(userId, { mfa_enabled: false, mfa_secret: null });
    await auditService.log(req, 'MFA_DISABLED', 'USER', userId, null, { action: 'MFA Disabled' });
    res.json({ message: 'MFA desactivado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const loginMfa = async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'userId y token son obligatorios.' });
    }

    const user = await userModel.findById(userId);
    if (!user || !user.is_active || !user.mfa_enabled) {
      return res.status(400).json({ error: 'Acceso denegado o MFA no activo.' });
    }

    const secret = await userModel.getMfaSecret(userId);

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Permite un margen de +- 30 segundos
    });

    if (verified) {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        mfa_enabled: user.mfa_enabled
      };

      const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

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

      await auditService.log(req, 'LOGIN_MFA', 'USER', user.id, null, { email: user.email });
      res.json({ message: 'Login exitoso con MFA.', token: jwtToken, user: userProfile });
    } else {
      res.status(400).json({ error: 'Código MFA incorrecto.' });
    }
  } catch (error) {
    next(error);
  }
};
