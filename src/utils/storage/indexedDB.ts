import { openDB, IDBPDatabase } from 'idb';
import type { ImageRecord } from '../../types';

const DB_NAME = 'lesson-notes-db';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          const store = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
          store.createIndex('noteId', 'noteId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export const imageDB = {
  async saveImage(image: ImageRecord): Promise<string> {
    const db = await getDB();
    await db.put(IMAGE_STORE, image);
    return image.id;
  },

  async getImage(id: string): Promise<ImageRecord | undefined> {
    const db = await getDB();
    const result = await db.get(IMAGE_STORE, id);
    return result as ImageRecord | undefined;
  },

  async getImageUrl(id: string): Promise<string | null> {
    const image = await this.getImage(id);
    if (!image || !image.data) return null;
    return URL.createObjectURL(image.data);
  },

  async deleteImage(id: string): Promise<void> {
    const db = await getDB();
    const image = await this.getImage(id);
    if (image) {
      await db.delete(IMAGE_STORE, id);
    }
  },

  async getImagesByNote(noteId: string): Promise<ImageRecord[]> {
    const db = await getDB();
    const index = db.transaction(IMAGE_STORE).store.index('noteId');
    const result = await index.getAll(noteId);
    return result as ImageRecord[];
  },

  async deleteImagesByNote(noteId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const index = tx.store.index('noteId');
    let cursor = await index.openCursor(noteId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  async saveImageFromBlob(blob: Blob, noteId: string): Promise<string> {
    const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: ImageRecord = {
      id,
      noteId,
      data: blob,
      type: blob.type,
      size: blob.size,
      createdAt: Date.now(),
    };
    await this.saveImage(record);
    return id;
  },

  async saveImagesFromBlobs(blobs: Blob[], noteId: string, onProgress?: (index: number, total: number) => void): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < blobs.length; i++) {
      const id = await this.saveImageFromBlob(blobs[i], noteId);
      ids.push(id);
      if (onProgress) {
        onProgress(i + 1, blobs.length);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return ids;
  },
};

export default imageDB;
