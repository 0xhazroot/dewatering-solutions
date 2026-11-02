import express from 'express';
import { chatWithBot, submitChatFeedback } from '../controllers/chatController.js';

const router = express.Router();

// Ruta pública: Todos los visitantes pueden hablar con el Agente IA y enviar feedback RLHF
router.post('/', chatWithBot);
router.post('/feedback', submitChatFeedback);

export default router;
