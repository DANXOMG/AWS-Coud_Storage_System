import { Router } from 'express';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authMiddleware } from '../middleware/auth';
import s3Client, { S3_BUCKET } from '../config/s3';
import db from '../config/database';

const router = Router();

// GET /files — Listar archivos del usuario (desde DB)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { folderId, starred, search } = req.query;

    let query = `
      SELECT id, file_name, file_type, file_size, mime_type, is_folder, 
             parent_folder_id, is_starred, antivirus_status, s3_key,
             created_at, updated_at
      FROM files 
      WHERE user_id = ? AND is_deleted = FALSE
    `;
    const params: any[] = [userId];

    if (folderId) {
      query += ' AND parent_folder_id = ?';
      params.push(folderId);
    } else {
      query += ' AND parent_folder_id IS NULL';
    }

    if (starred === 'true') {
      query += ' AND is_starred = TRUE';
    }

    if (search) {
      query += ' AND file_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY is_folder DESC, file_name ASC';

    const [files] = await db.query(query, params);

    res.json({ files });
  } catch (error) {
    console.error('Error listando archivos:', error);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

// GET /files/download/:fileId — URL prefirmada para descargar (15 min)
router.get('/download/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;

    const [files] = await db.query(
      'SELECT s3_key, file_name, mime_type, is_folder, file_size FROM files WHERE id = ? AND user_id = ? AND is_deleted = FALSE',
      [fileId, userId]
    );

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const file = files[0] as any;

    if (file.is_folder) {
      return res.status(400).json({ error: 'No se puede descargar una carpeta' });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.s3_key,
      ResponseContentDisposition: `attachment; filename="${file.file_name}"`,
      ResponseContentType: file.mime_type,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // Auditoría
    await db.query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'download', 'file', fileId, req.ip, req.get('user-agent')]
    );

    res.json({ url: signedUrl, fileName: file.file_name, mimeType: file.mime_type });
  } catch (error) {
    console.error('Error generando URL descarga:', error);
    res.status(500).json({ error: 'Error al generar URL de descarga' });
  }
});

// GET /files/view/:fileId — URL prefirmada para visualizar en navegador (PDF, imágenes)
router.get('/view/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;

    const [files] = await db.query(
      'SELECT s3_key, file_name, mime_type, is_folder FROM files WHERE id = ? AND user_id = ? AND is_deleted = FALSE',
      [fileId, userId]
    );

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const file = files[0] as any;

    if (file.is_folder) {
      return res.status(400).json({ error: 'No se puede visualizar una carpeta' });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.s3_key,
      ResponseContentDisposition: `inline; filename="${file.file_name}"`,
      ResponseContentType: file.mime_type,
    });

    // URL válida 1 hora para visualización
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ url: signedUrl, fileName: file.file_name, mimeType: file.mime_type });
  } catch (error) {
    console.error('Error generando URL visualización:', error);
    res.status(500).json({ error: 'Error al generar URL de visualización' });
  }
});

// PATCH /files/star/:fileId — Marcar como destacado
router.patch('/star/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;
    const { starred } = req.body;

    await db.query(
      'UPDATE files SET is_starred = ? WHERE id = ? AND user_id = ?',
      [starred, fileId, userId]
    );

    res.json({ message: 'Archivo actualizado' });
  } catch (error) {
    console.error('Error actualizando archivo:', error);
    res.status(500).json({ error: 'Error al actualizar archivo' });
  }
});

// DELETE /files/:fileId — Eliminar archivo (papelera + borrar de S3)
router.delete('/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;

    const [files] = await db.query(
      'SELECT s3_key, file_size, is_folder FROM files WHERE id = ? AND user_id = ? AND is_deleted = FALSE',
      [fileId, userId]
    );

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const file = files[0] as any;

    // Borrar de S3 si no es carpeta
    if (!file.is_folder && file.s3_key) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.s3_key,
        }));
      } catch (s3Err) {
        console.warn('[!] No se pudo borrar de S3:', s3Err);
      }
    }

    // Marcar como eliminado en DB
    await db.query(
      'UPDATE files SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );

    // Actualizar storage_used
    if (!file.is_folder) {
      await db.query(
        'UPDATE users SET storage_used = GREATEST(0, storage_used - ?) WHERE id = ?',
        [file.file_size, userId]
      );
    }

    // Auditoría
    await db.query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'delete', 'file', fileId, req.ip, req.get('user-agent')]
    );

    res.json({ message: 'Archivo eliminado' });
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

// POST /files/folder — Crear carpeta
router.post('/folder', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { folderName, parentFolderId } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: 'Nombre de carpeta requerido' });
    }

    const [result] = await db.query(
      'INSERT INTO files (user_id, file_name, file_path, file_size, s3_key, is_folder, parent_folder_id) VALUES (?, ?, ?, 0, ?, TRUE, ?)',
      [userId, folderName, parentFolderId ? `folder/${parentFolderId}` : '/', `folder-${Date.now()}`, parentFolderId || null]
    );

    const folderId = (result as any).insertId;

    res.status(201).json({
      message: 'Carpeta creada',
      folder: { id: folderId, name: folderName },
    });
  } catch (error) {
    console.error('Error creando carpeta:', error);
    res.status(500).json({ error: 'Error al crear carpeta' });
  }
});

// GET /files/storage/stats — Estadísticas de almacenamiento
router.get('/storage/stats', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const [users] = await db.query(
      'SELECT storage_quota, storage_used FROM users WHERE id = ?',
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0] as any;

    res.json({
      storageQuota: user.storage_quota,
      storageUsed: user.storage_used,
      storageAvailable: user.storage_quota - user.storage_used,
      percentageUsed: (user.storage_used / user.storage_quota) * 100,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});


// GET /files/folders — Listar solo carpetas del usuario
router.get('/folders', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [folders] = await db.query(
      'SELECT id, file_name FROM files WHERE user_id = ? AND is_folder = TRUE AND is_deleted = FALSE ORDER BY file_name ASC',
      [userId]
    );
    res.json({ folders });
  } catch (error) {
    console.error('Error listando carpetas:', error);
    res.status(500).json({ error: 'Error al listar carpetas' });
  }
});

// PATCH /files/move/:fileId — Mover archivo a carpeta
router.patch('/move/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;
    const { targetFolderId } = req.body;

    await db.query(
      'UPDATE files SET parent_folder_id = ? WHERE id = ? AND user_id = ?',
      [targetFolderId || null, fileId, userId]
    );

    res.json({ message: 'Archivo movido correctamente' });
  } catch (error) {
    console.error('Error moviendo archivo:', error);
    res.status(500).json({ error: 'Error al mover archivo' });
  }
});


// PATCH /files/rename/:fileId — Renombrar archivo
router.patch('/rename/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;
    const { newName } = req.body;
    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }
    await db.query(
      'UPDATE files SET file_name = ? WHERE id = ? AND user_id = ?',
      [newName.trim(), fileId, userId]
    );
    res.json({ message: 'Archivo renombrado correctamente' });
  } catch (error) {
    console.error('Error renombrando archivo:', error);
    res.status(500).json({ error: 'Error al renombrar archivo' });
  }
});

// DELETE /files/permanent/:fileId — Eliminar permanentemente
router.delete('/permanent/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;
    const [files] = await db.query(
      'SELECT s3_key, file_size, is_folder FROM files WHERE id = ? AND user_id = ? AND is_deleted = TRUE',
      [fileId, userId]
    );
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado en papelera' });
    }
    const file = files[0] as any;
    if (!file.is_folder && file.s3_key) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: file.s3_key }));
      } catch (s3Err) {
        console.warn('[!] No se pudo borrar de S3:', s3Err);
      }
    }
    await db.query('DELETE FROM files WHERE id = ? AND user_id = ?', [fileId, userId]);
    if (!file.is_folder) {
      await db.query(
        'UPDATE users SET storage_used = GREATEST(0, storage_used - ?) WHERE id = ?',
        [file.file_size, userId]
      );
    }
    res.json({ message: 'Archivo eliminado permanentemente' });
  } catch (error) {
    console.error('Error eliminando permanentemente:', error);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});


// PATCH /files/restore/:fileId — Restaurar desde papelera
router.patch('/restore/:fileId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fileId } = req.params;
    await db.query(
      'UPDATE files SET is_deleted = FALSE, deleted_at = NULL WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );
    res.json({ message: 'Archivo restaurado correctamente' });
  } catch (error) {
    console.error('Error restaurando archivo:', error);
    res.status(500).json({ error: 'Error al restaurar archivo' });
  }
});


// GET /files/trash — Listar archivos en papelera
router.get('/trash', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [files] = await db.query(
      `SELECT id, file_name, file_type, file_size, mime_type, is_folder,
              parent_folder_id, is_starred, antivirus_status, s3_key,
              created_at, updated_at
       FROM files WHERE user_id = ? AND is_deleted = TRUE
       ORDER BY deleted_at DESC`,
      [userId]
    );
    res.json({ files });
  } catch (error) {
    console.error('Error listando papelera:', error);
    res.status(500).json({ error: 'Error al listar papelera' });
  }
});

export default router;