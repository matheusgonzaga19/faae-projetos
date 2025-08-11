import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Response } from 'express';
import { storage } from '../storage';
import { File, InsertFile } from '@shared/schema';

interface FileUploadData {
  taskId?: number;
  projectId?: number;
  uploadedUserId: string;
}

class FileService {
  private uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async saveFile(
    file: Express.Multer.File,
    metadata: FileUploadData
  ): Promise<File> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.originalname}`;
    const filePath = path.join(this.uploadsDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    const fileData: InsertFile = {
      originalName: file.originalname,
      filename: fileName,
      path: filePath,
      mimeType: file.mimetype,
      size: file.size,
      taskId: metadata.taskId,
      projectId: metadata.projectId,
      uploadedUserId: metadata.uploadedUserId,
    };

    return await storage.uploadFile(fileData);
  }

  async downloadFile(file: File, res: Response): Promise<void> {
    try {
      await fs.access(file.path);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.sendFile(path.resolve(file.path));
    } catch {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  }

  async deleteFile(file: File): Promise<void> {
    try {
      await fs.unlink(file.path);
    } catch {
      // File already deleted or doesn't exist
    }
    await storage.deleteFile(file.id);
  }

  async getFilePreview(file: File): Promise<{
    type: 'image' | 'pdf' | 'text' | 'other';
    url?: string;
    content?: string;
  }> {
    const mimeType = file.mimeType || '';
    
    if (mimeType.startsWith('image/')) {
      return {
        type: 'image',
        url: `/api/files/${file.id}/download`,
      };
    }
    
    if (mimeType === 'application/pdf') {
      return {
        type: 'pdf',
        url: `/api/files/${file.id}/download`,
      };
    }
    
    if (mimeType.startsWith('text/')) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        return {
          type: 'text',
          content: content.substring(0, 1000), // Limit preview
        };
      } catch {
        return { type: 'other' };
      }
    }
    
    return { type: 'other' };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string, fileName: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'file-text';
    if (mimeType.startsWith('text/')) return 'file-text';
    if (mimeType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return 'file-spreadsheet';
    if (mimeType.includes('presentation') || fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    return 'file';
  }
}

export const fileService = new FileService();

// Multer configuration
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});