import { Router } from 'express';
import * as quotCtrl from '../controllers/quotationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

// Descarga directa de PDF oficial (accesible desde CRM, Portal Cliente, Chatbot IA y enlaces de WhatsApp)
router.get('/:id/pdf', quotCtrl.downloadPDF);

router.use(requireAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL', 'CLIENT']), quotCtrl.getAll);
router.get('/stats', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), quotCtrl.getStats);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL', 'CLIENT']), quotCtrl.getById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), quotCtrl.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL']), quotCtrl.update);
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'COMMERCIAL', 'CLIENT']), quotCtrl.updateStatus);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), quotCtrl.remove);

export default router;
