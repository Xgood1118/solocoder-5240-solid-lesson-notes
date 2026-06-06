import { createSignal } from 'solid-js';
import { noteStorage, syncQueueStorage } from '../storage/localStorage';
import type { Note, SyncQueueItem, ConflictInfo } from '../../types';

const SYNC_CHANNEL = 'lesson-notes-sync';
const MAX_RETRIES = 3;

let channel: BroadcastChannel | null = null;
let syncTimer: number | null = null;

const [isOnline, setIsOnline] = createSignal(navigator.onLine);
const [syncStatus, setSyncStatus] = createSignal<'idle' | 'syncing' | 'conflict' | 'error'>('idle');
const [conflicts, setConflicts] = createSignal<ConflictInfo[]>([]);
const [pendingCount, setPendingCount] = createSignal(0);

function initBroadcastChannel(): void {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(SYNC_CHANNEL);
    
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'note-updated':
          handleRemoteNoteUpdate(payload);
          break;
        case 'note-created':
          handleRemoteNoteCreate(payload);
          break;
        case 'note-deleted':
          handleRemoteNoteDelete(payload);
          break;
        case 'sync-request':
          handleSyncRequest(payload);
          break;
        case 'conflict':
          handleRemoteConflict(payload);
          break;
      }
    };
  }
}

function handleRemoteNoteUpdate(remoteNote: Note): void {
  const localNote = noteStorage.getById(remoteNote.id);
  
  if (!localNote) {
    noteStorage.save(remoteNote);
    return;
  }
  
  if (localNote.version === remoteNote.version) {
    return;
  }
  
  if (localNote.updatedAt > remoteNote.updatedAt) {
    const hasConflict = localNote.isSynced === false;
    if (hasConflict) {
      addConflict(localNote, remoteNote);
    }
  } else {
    noteStorage.save(remoteNote);
  }
}

function handleRemoteNoteCreate(remoteNote: Note): void {
  const localNote = noteStorage.getById(remoteNote.id);
  if (!localNote) {
    noteStorage.save(remoteNote);
  }
}

function handleRemoteNoteDelete(noteId: string): void {
  noteStorage.delete(noteId);
}

function handleSyncRequest(deviceId: string): void {
  const notes = noteStorage.getAll();
  channel?.postMessage({
    type: 'sync-response',
    payload: { notes, deviceId: getDeviceId() },
  });
}

function handleRemoteConflict(conflict: ConflictInfo): void {
  setConflicts(prev => [...prev, conflict]);
  setSyncStatus('conflict');
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem('device-id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device-id', deviceId);
  }
  return deviceId;
}

function addConflict(localNote: Note, remoteNote: Note): void {
  const conflict: ConflictInfo = {
    noteId: localNote.id,
    localVersion: localNote,
    remoteVersion: remoteNote,
    timestamp: Date.now(),
  };
  setConflicts(prev => {
    const existing = prev.find(c => c.noteId === conflict.noteId);
    if (existing) return prev;
    return [...prev, conflict];
  });
  setSyncStatus('conflict');
}

export function resolveConflict(noteId: string, choice: 'local' | 'remote' | 'merge'): void {
  const conflict = conflicts().find(c => c.noteId === noteId);
  if (!conflict) return;
  
  if (choice === 'local') {
    const updatedNote = {
      ...conflict.localVersion,
      version: generateVersion(),
      isSynced: false,
      updatedAt: Date.now(),
    };
    noteStorage.save(updatedNote);
    broadcastNoteUpdate(updatedNote);
  } else if (choice === 'remote') {
    const updatedNote = {
      ...conflict.remoteVersion,
      isSynced: true,
    };
    noteStorage.save(updatedNote);
  }
  
  setConflicts(prev => prev.filter(c => c.noteId !== noteId));
  
  if (conflicts().length <= 1) {
    setSyncStatus('idle');
  }
}

function generateVersion(): string {
  return `v-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function broadcastNoteUpdate(note: Note): void {
  if (channel) {
    channel.postMessage({
      type: note.isSynced ? 'note-updated' : 'note-created',
      payload: note,
    });
  }
}

export function broadcastNoteDelete(noteId: string): void {
  if (channel) {
    channel.postMessage({
      type: 'note-deleted',
      payload: noteId,
    });
  }
}

export function addToSyncQueue(noteId: string, action: 'create' | 'update' | 'delete', payload: Partial<Note>): void {
  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    noteId,
    action,
    retryCount: 0,
    status: 'pending',
    createdAt: Date.now(),
    payload,
  };
  syncQueueStorage.add(item);
  updatePendingCount();
  scheduleSync();
}

function updatePendingCount(): void {
  const pending = syncQueueStorage.getPending();
  setPendingCount(pending.length);
}

function scheduleSync(): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = window.setTimeout(() => {
    processSyncQueue();
  }, 3000);
}

async function processSyncQueue(): Promise<void> {
  if (!isOnline()) {
    return;
  }
  
  setSyncStatus('syncing');
  
  const pending = syncQueueStorage.getPending();
  
  for (const item of pending) {
    try {
      syncQueueStorage.update(item.id, { status: 'syncing' });
      
      await simulateSync(item);
      
      syncQueueStorage.remove(item.id);
      
      const note = noteStorage.getById(item.noteId);
      if (note) {
        const updatedNote = { ...note, isSynced: true };
        noteStorage.save(updatedNote);
      }
      
    } catch (error) {
      const newRetryCount = item.retryCount + 1;
      
      if (newRetryCount >= MAX_RETRIES) {
        syncQueueStorage.update(item.id, {
          status: 'failed',
          retryCount: newRetryCount,
        });
      } else {
        syncQueueStorage.update(item.id, {
          status: 'pending',
          retryCount: newRetryCount,
        });
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  updatePendingCount();
  setSyncStatus('idle');
}

async function simulateSync(item: SyncQueueItem): Promise<void> {
  return new Promise((resolve, reject) => {
    const successRate = 0.9;
    setTimeout(() => {
      if (Math.random() < successRate) {
        resolve();
      } else {
        reject(new Error('Sync failed'));
      }
    }, 300);
  });
}

export function retryFailedSyncs(): void {
  const failed = syncQueueStorage.getAll().filter(item => item.status === 'failed');
  failed.forEach(item => {
    syncQueueStorage.update(item.id, { status: 'pending', retryCount: 0 });
  });
  updatePendingCount();
  scheduleSync();
}

export function initSyncService(): void {
  initBroadcastChannel();
  
  window.addEventListener('online', () => {
    setIsOnline(true);
    scheduleSync();
  });
  
  window.addEventListener('offline', () => {
    setIsOnline(false);
    const notes = noteStorage.getAll();
    notes.forEach(note => {
      if (note.isSynced) {
        noteStorage.save({ ...note, isSynced: false });
      }
    });
  });
  
  updatePendingCount();
  
  if (isOnline()) {
    scheduleSync();
  }
}

export {
  isOnline,
  syncStatus,
  conflicts,
  pendingCount,
};
