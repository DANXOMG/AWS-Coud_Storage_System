import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verificar que la sesión existe y no ha expirado
    const [sessions] = await db.query(
      'SELECT id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada' });
    }

    // Verificar que el usuario está activo
    const [users] = await db.query(
      'SELECT id, email FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    // Agregar información del usuario al request
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}
