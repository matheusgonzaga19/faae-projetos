import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { firebaseService } from './firebaseService';

export interface UploadResult {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: Date;
}

export const firebaseStorageService = {
  async uploadFile(
    file: File,
    options: {
      taskId?: string;
      projectId?: string;
      uploadedUserId: string;
    }
  ): Promise<UploadResult> {
    try {
      // Create a unique file name
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      
      // Determine storage path based on context
      let storagePath = '';
      if (options.taskId) {
        storagePath = `tasks/${options.taskId}/${fileName}`;
      } else if (options.projectId) {
        storagePath = `projects/${options.projectId}/${fileName}`;
      } else {
        storagePath = `general/${fileName}`;
      }

      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save file metadata to Firestore
      const fileMetadata = await firebaseService.addFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadURL,
        taskId: options.taskId,
        projectId: options.projectId,
        uploadedUserId: options.uploadedUserId,
      });

      return {
        id: fileMetadata.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadURL,
        createdAt: fileMetadata.createdAt,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file metadata from Firestore
      const file = await firebaseService.getFileById(fileId);
      
      if (!file) {
        throw new Error('File not found');
      }

      // Delete from Firebase Storage
      const fileRef = ref(storage, file.url);
      await deleteObject(fileRef);

      // Delete metadata from Firestore
      await firebaseService.deleteFile(fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  },

  async getFileDownloadUrl(filePath: string): Promise<string> {
    try {
      const fileRef = ref(storage, filePath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to get file download URL');
    }
  },
};
