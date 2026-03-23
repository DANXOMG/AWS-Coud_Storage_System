import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import uploadRoutes from './routes/upload';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS - Solo permitir origen desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 150,
  handler: (req, res) => {
    res.status(429).json({ error: 'Demasiadas peticiones, por favor intenta más tarde' });
  },
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/files', filesRoutes);
app.use('/upload', uploadRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`[+] API Server running on port ${PORT}`);
  console.log(`[+] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;