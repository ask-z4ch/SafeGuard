import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');
const sosDir = path.join(uploadsDir, 'sos');

const ensureDir = (dirPath) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// key derivation tied to VERAMO_SECRET — changing it will break decryption of existing files
const buildEncryptionKey = () => {
  const baseSecret = process.env.VERAMO_SECRET || process.env.JWT_SECRET;
  if (!baseSecret) {
    throw new Error('VERAMO_SECRET (or JWT_SECRET) is required to derive encryption key');
  }

  return crypto.createHash('sha256').update(baseSecret).digest();
};

export const saveEncryptedFile = async ({ buffer, originalName, mimeType }) => {
  ensureDir(uploadsDir);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', buildEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const fileName = `${crypto.randomUUID()}.bin`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.writeFile(filePath, encrypted);

  return {
    fileName,
    filePath,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    mimeType,
    originalName,
    size: buffer.length
  };
};

export const readAndDecryptFile = async ({ filePath, ivHex, authTagHex }) => {
  const encrypted = await fs.readFile(filePath);
  const decipher = crypto.createDecipheriv('aes-256-gcm', buildEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

export const saveAudioFile = async ({ buffer, originalName }) => {
  ensureDir(sosDir);
  const fileExt = path.extname(originalName) || '.bin';
  const fileName = `${crypto.randomUUID()}${fileExt}`;
  const filePath = path.join(sosDir, fileName);
  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    size: buffer.length
  };
};

export const getUploadsRoot = () => uploadsDir;
