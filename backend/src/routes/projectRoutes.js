import { Router } from 'express';
import * as projCtrl from '../controllers/projectController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER', 'CLIENT']), projCtrl.getAll);
router.get('/stats', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER']), projCtrl.getStats);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER', 'CLIENT']), projCtrl.getById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), projCtrl.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ENGINEER']), projCtrl.update);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), projCtrl.remove);

export default router;
