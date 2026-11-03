import { Router } from 'express';
import * as docCtrl from '../controllers/documentController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

// Rutas públicas — documentos marcados como públicos
router.get('/public', (req, res, next) => { req.query.is_public = true; docCtrl.getAll(req, res, next); });
router.post('/:id/download', docCtrl.download);

// Rutas protegidas
router.use(requireAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER', 'CLIENT']), docCtrl.getAll);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER', 'CLIENT']), docCtrl.getById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER']), docCtrl.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER']), docCtrl.update);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), docCtrl.remove);

export default router;
