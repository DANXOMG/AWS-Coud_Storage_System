import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authMiddleware } from '../middleware/auth';
import s3Client, { S3_BUCKET, S3_REGION } from '../config/s3';
import db from '../config/database';
import { scanFile } from '../services/antivirusService';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
});

// POST /upload — Subir archivo
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }

      const userId = (req as any).userId;
      const userEmail = (req as any).userEmail;
      const { folderId } = req.body;

      // Obtener datos del usuario
      const [users] = await db.query(
        'SELECT s3_bucket_name, storage_quota, storage_used FROM users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = users[0] as any;

      // Verificar cuota
      if (user.storage_used + req.file.size > user.storage_quota) {
        return res.status(413).json({
          error: 'Cuota de almacenamiento excedida',
          storageUsed: user.storage_used,
          storageQuota: user.storage_quota,
        });
      }

      // Escanear con antivirus
      console.log(`[+] Escaneando archivo: ${req.file.originalname}`);
      const scanResult = await scanFile(req.file.buffer, req.file.originalname);

      if (scanResult.status === 'infected') {
        console.log(`[!] Archivo infectado detectado: ${req.file.originalname}`);

        await db.query(
          'INSERT INTO antivirus_logs (user_id, scan_status, threat_name, scan_details) VALUES (?, ?, ?, ?)',
          [userId, 'infected', scanResult.threatName, scanResult.details]
        );

        return res.status(400).json({
          error: 'Archivo infectado detectado',
          threatName: scanResult.threatName,
          details: scanResult.details,
        });
      }

      if (scanResult.status === 'error') {
        console.warn(`[!] Error al escanear: ${req.file.originalname}`);
      }

      // Generar clave S3
      const fileExtension = req.file.originalname.split('.').pop();
      const s3Key = `${uuidv4()}.${fileExtension}`;
      const objectKey = `${user.s3_bucket_name}/${s3Key}`;

      // Subir a S3 con AWS SDK
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: objectKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ContentLength: req.file.size,
        Metadata: {
          'original-name': req.file.originalname,
          'uploaded-by': userEmail,
        },
      }));

      console.log(`[+] Archivo subido a S3: ${objectKey}`);

      // Guardar metadatos en DB
      const [result] = await db.query(
        `INSERT INTO files 
        (user_id, file_name, file_path, file_type, file_size, s3_key, mime_type, parent_folder_id, antivirus_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          req.file.originalname,
          folderId ? `folder/${folderId}` : '/',
          fileExtension,
          req.file.size,
          objectKey,
          req.file.mimetype,
          folderId || null,
          scanResult.status === 'clean' ? 'clean' : 'error',
        ]
      );

      const fileId = (result as any).insertId;

      // Actualizar uso de almacenamiento
      await db.query(
        'UPDATE users SET storage_used = storage_used + ? WHERE id = ?',
        [req.file.size, userId]
      );

      // Log antivirus
      if (scanResult.status === 'clean') {
        await db.query(
          'INSERT INTO antivirus_logs (file_id, user_id, scan_status, scan_details) VALUES (?, ?, ?, ?)',
          [fileId, userId, 'clean', 'File scanned successfully']
        );
        await db.query(
          'UPDATE files SET antivirus_scanned_at = NOW() WHERE id = ?',
          [fileId]
        );
      }

      // Auditoría
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'upload', 'file', fileId, req.ip, req.get('user-agent'), JSON.stringify({ fileName: req.file.originalname, fileSize: req.file.size })]
      );

      res.status(201).json({
        message: 'Archivo subido exitosamente',
        file: {
          id: fileId,
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          s3Key,
          antivirusStatus: scanResult.status,
        },
      });
    } catch (error: any) {
      console.error('Error en upload:', error);
      res.status(500).json({ error: 'Error al subir el archivo', details: error.message });
    }
  }
);

// GET /upload/download/:fileId — URL prefirmada para descargar/visualizar
router.get(
  '/download/:fileId',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { fileId } = req.params;

      const [files] = await db.query(
        'SELECT s3_key, file_name, mime_type FROM files WHERE id = ? AND user_id = ? AND is_deleted = FALSE',
        [fileId, userId]
      );

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      const file = files[0] as any;

      // Generar URL prefirmada válida 15 minutos
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: file.s3_key,
        ResponseContentDisposition: `inline; filename="${file.file_name}"`,
        ResponseContentType: file.mime_type,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      res.json({ url: signedUrl, fileName: file.file_name, mimeType: file.mime_type });
    } catch (error: any) {
      console.error('Error generando URL:', error);
      res.status(500).json({ error: 'Error al generar URL de descarga', details: error.message });
    }
  }
);

export default router;