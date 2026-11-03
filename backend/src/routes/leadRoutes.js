import { Router } from 'express';
import * as leadCtrl from '../controllers/leadController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

// Ruta pública — formulario de contacto crea un lead sin auth
router.post('/public', leadCtrl.create);

// Rutas protegidas
router.use(requireAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), leadCtrl.getAll);
router.get('/stats', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), leadCtrl.getStats);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), leadCtrl.getById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), leadCtrl.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), leadCtrl.update);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), leadCtrl.remove);

export default router;
