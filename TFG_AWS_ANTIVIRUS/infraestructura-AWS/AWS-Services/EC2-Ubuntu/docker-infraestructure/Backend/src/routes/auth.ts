import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import s3Client, { S3_BUCKET } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Registro de usuario
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName } = req.body;

      const [existingUsers] = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        return res.status(409).json({ error: 'El usuario ya existe' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userPrefix = `user-${email
        .split('@')[0]
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()}-${uuidv4().substring(0, 8)}`;

      const [result] = await db.query(
        'INSERT INTO users (email, password_hash, full_name, s3_bucket_name) VALUES (?, ?, ?, ?)',
        [email, passwordHash, fullName || null, userPrefix]
      );

      const userId = (result as any).insertId;
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

      await db.query(
        'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [userId, token, req.ip, req.get('user-agent')]
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: userId,
          email,
          fullName: fullName || null,
          bucketName: S3_BUCKET,
        },
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const [users] = await db.query(
        'SELECT id, email, password_hash, full_name, s3_bucket_name, storage_quota, storage_used, is_active FROM users WHERE email = ?',
        [email]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = users[0] as any;

      if (!user.is_active) {
        return res.status(403).json({ error: 'Cuenta desactivada' });
      }

      // Verificar contraseña ANTES de generar token
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      // Borrar sesiones anteriores para evitar duplicate entry
      await db.query('DELETE FROM sessions WHERE user_id = ?', [user.id]);

      await db.query(
        'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [user.id, token, req.ip, req.get('user-agent')]
      );

      await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          bucketName: user.s3_bucket_name,
          storageQuota: user.storage_quota,
          storageUsed: user.storage_used,
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await db.query('DELETE FROM sessions WHERE token = ?', [token]);
    }
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const [sessions] = await db.query(
      'SELECT id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada' });
    }

    const [users] = await db.query(
      'SELECT id, email, full_name, s3_bucket_name, storage_quota, storage_used FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0] as any;

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        bucketName: user.s3_bucket_name,
        storageQuota: user.storage_quota,
        storageUsed: user.storage_used,
      },
    });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});


// PATCH /auth/password — Cambiar contraseña
router.patch('/password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const [users] = await db.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0] as any;
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, decoded.userId]);
    await db.query('DELETE FROM sessions WHERE user_id = ?', [decoded.userId]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// PATCH /auth/profile — Actualizar nombre
router.patch('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { fullName } = req.body;
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }
    await db.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName.trim(), decoded.userId]);
    const [users] = await db.query(
      'SELECT id, email, full_name, s3_bucket_name FROM users WHERE id = ?',
      [decoded.userId]
    );
    const user = (users as any[])[0];
    res.json({ message: 'Perfil actualizado', user: { id: user.id, email: user.email, fullName: user.full_name, bucketName: user.s3_bucket_name } });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
