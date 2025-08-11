import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_BASE_PATH = '/tmp/permeate-storage';

export async function saveToStorage(filePath: string, content: string): Promise<string> {
  const isDevMode = process.env.DEV_STORAGE_MODE === 'local';
  
  if (isDevMode) {
    // Local development storage
    const fullPath = path.join(STORAGE_BASE_PATH, filePath);
    const dirPath = path.dirname(fullPath);
    
    try {
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, content, 'utf8');
      
      // Return file:// URL for development
      return `file://${fullPath}`;
    } catch (error) {
      console.error('Local storage error:', error);
      throw new Error('Failed to save file to local storage');
    }
  } else {
    // Production would use S3 or similar
    // For now, just return a mock URL
    return `https://storage.permeate.app/${filePath}`;
  }
}

export async function getFromStorage(filePath: string): Promise<string> {
  const isDevMode = process.env.DEV_STORAGE_MODE === 'local';
  
  if (isDevMode) {
    const fullPath = path.join(STORAGE_BASE_PATH, filePath);
    
    try {
      return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      console.error('Local storage read error:', error);
      throw new Error('Failed to read file from local storage');
    }
  } else {
    throw new Error('Production storage not implemented');
  }
}

export async function deleteFromStorage(filePath: string): Promise<void> {
  const isDevMode = process.env.DEV_STORAGE_MODE === 'local';
  
  if (isDevMode) {
    const fullPath = path.join(STORAGE_BASE_PATH, filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Local storage delete error:', error);
      throw new Error('Failed to delete file from local storage');
    }
  } else {
    throw new Error('Production storage not implemented');
  }
}