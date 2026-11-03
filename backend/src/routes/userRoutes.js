import { Router } from 'express';
import * as userCtrl from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.getAll);
router.get('/stats', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.getStats);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.getById);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.update);
router.patch('/:id/toggle', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.toggleActive);
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.toggleActive);
router.patch('/:id/password', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.changePassword);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), userCtrl.remove);

export default router;
