import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandler from './middlewares/errorHandler.js';

// Rutas de la plataforma Dewatering Solutions
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import productRoutes from './routes/productRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Middlewares Globales
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(morgan('dev'));

// ==================== RUTAS ====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Dewatering Solutions API is running.',
    version: '1.0.0',
    endpoints: [
      '/api/auth', '/api/users', '/api/leads', '/api/quotations',
      '/api/services', '/api/products', '/api/projects', '/api/documents', '/api/audit'
    ]
  });
});

// Dashboard KPIs agregados
app.get('/api/dashboard', async (req, res, next) => {
  try {
    const { requireAuth } = await import('./middlewares/authMiddleware.js');
    // Verificar auth inline
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Auth requerida.' });

    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    
    // RBAC: Clientes no tienen acceso a métricas ni telemetría global
    if (decoded.role === 'CLIENT') {
      return res.status(403).json({ error: 'Acceso no autorizado para rol CLIENT.' });
    }
    
    const [userModel, leadModel, quotationModel, projectModel] = await Promise.all([
      import('./models/userModel.js'), import('./models/leadModel.js'),
      import('./models/quotationModel.js'), import('./models/projectModel.js')
    ]);

    const [users, leads, quotations, projects] = await Promise.all([
      userModel.default.getStats(), leadModel.default.getStats(),
      quotationModel.default.getStats(), projectModel.default.getStats()
    ]);

    res.json({ users, leads, quotations, projects });
  } catch (error) { next(error); }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler global
app.use(errorHandler);

export default app;
