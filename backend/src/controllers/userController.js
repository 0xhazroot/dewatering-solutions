import userModel from '../models/userModel.js';
import auditService from '../services/auditService.js';
import bcrypt from 'bcrypt';

export const getAll = async (req, res, next) => {
  try {
    const users = await userModel.findAll(req.query);
    res.json({ users });
  } catch (error) { next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ user });
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const old = await userModel.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const user = await userModel.update(req.params.id, req.body);
    await auditService.log(req, 'UPDATE', 'USER', user.id, old, user);
    res.json({ message: 'Usuario actualizado.', user });
  } catch (error) { next(error); }
};

export const toggleActive = async (req, res, next) => {
  try {
    const is_active = req.body.is_active !== undefined 
      ? req.body.is_active 
      : (req.body.activo !== undefined ? req.body.activo : req.body.status);

    if (req.user && req.user.id === req.params.id && !is_active) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta en sesión.' });
    }

    const user = await userModel.toggleActive(req.params.id, is_active);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await auditService.log(req, is_active ? 'ACTIVATE' : 'DEACTIVATE', 'USER', user.id, null, { is_active });
    res.json({ message: `Usuario ${is_active ? 'activado' : 'desactivado'}.`, user });
  } catch (error) { next(error); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    if (!new_password) return res.status(400).json({ error: 'Nueva contraseña requerida.' });
    const hash = await bcrypt.hash(new_password, 12);
    const user = await userModel.updatePassword(req.params.id, hash);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await auditService.log(req, 'CHANGE_PASSWORD', 'USER', user.id);
    res.json({ message: 'Contraseña actualizada.' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    if (req.user && req.user.id === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta en sesión activa.' });
    }
    const user = await userModel.delete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await auditService.log(req, 'DELETE', 'USER', user.id, user, null);
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) { next(error); }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await userModel.getStats();
    res.json({ stats });
  } catch (error) { next(error); }
};
