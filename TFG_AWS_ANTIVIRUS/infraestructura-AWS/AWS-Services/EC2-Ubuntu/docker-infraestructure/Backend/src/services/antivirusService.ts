import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

const ANTIVIRUS_URL = process.env.ANTIVIRUS_URL || 'http://antivirus:5000';

export interface AntivirusScanResult {
  status: 'clean' | 'infected' | 'error';
  threatName?: string;
  details?: string;
}

/**
 * Escanea un archivo usando el servicio de antivirus
 */
export async function scanFile(
  fileBuffer: Buffer,
  fileName: string
): Promise<AntivirusScanResult> {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    const response = await axios.post(`${ANTIVIRUS_URL}/scan`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 segundos timeout
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // Adaptamos al formato del FastAPI de tu antivirus (status: CLEAN / MALWARE_DETECTED)
    const statusRaw = (response.data.status || '').toString();
    const status = statusRaw.toUpperCase();

    // Casos "limpio"
    if (
      response.data.infected === false ||
      status === 'CLEAN'
    ) {
      return {
        status: 'clean',
      };
    }

    // Casos "infectado"
    if (
      response.data.infected === true ||
      status === 'MALWARE_DETECTED' ||
      status === 'INFECTED'
    ) {
      const analysis = response.data.analysis || {};
      return {
        status: 'infected',
        threatName:
          response.data.virus ||
          response.data.threatName ||
          analysis.name ||
          analysis.label ||
          'Unknown threat',
        details: response.data.details || JSON.stringify(analysis),
      };
    }

    return {
      status: 'error',
      details: 'Unknown scan result format from antivirus',
    };
  } catch (error: any) {
    console.error('Antivirus scan error:', error.message);
    return {
      status: 'error',
      details: error.message,
    };
  }
}

/**
 * Escanea un archivo desde S3
 */
export async function scanFileFromS3(
  fileStream: Readable,
  fileName: string
): Promise<AntivirusScanResult> {
  try {
    const chunks: Buffer[] = [];
    
    for await (const chunk of fileStream) {
      chunks.push(Buffer.from(chunk));
    }
    
    const fileBuffer = Buffer.concat(chunks);
    return await scanFile(fileBuffer, fileName);
  } catch (error: any) {
    console.error('S3 to antivirus scan error:', error.message);
    return {
      status: 'error',
      details: error.message,
    };
  }
}

/**
 * Verifica la salud del servicio de antivirus
 */
export async function checkAntivirusHealth(): Promise<boolean> {
  try {
    // FastAPI expone /docs y /openapi.json si la app está viva
    const response = await axios.get(`${ANTIVIRUS_URL}/docs`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Antivirus health check failed');
    return false;
  }
}
