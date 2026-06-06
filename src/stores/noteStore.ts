import { createStore } from 'solid-js/store';
import { noteStorage, generateId } from '../utils/storage/localStorage';
import type { Note, NoteType } from '../types';
import { broadcastNoteUpdate, broadcastNoteDelete, addToSyncQueue } from '../utils/sync/syncService';

interface NoteState {
  notes: Note[];
  currentNoteId: string | null;
  loading: boolean;
}

const [state, setState] = createStore<NoteState>({
  notes: [],
  currentNoteId: null,
  loading: false,
});

export function loadNotes(): void {
  setState('loading', true);
  const notes = noteStorage.getAll();
  setState('notes', notes);
  setState('loading', false);
}

export function getNotesByCourse(courseId: string): Note[] {
  return state.notes.filter(n => n.courseId === courseId);
}

export function getNotesByCourseAndType(courseId: string, type: NoteType): Note[] {
  return state.notes.filter(n => n.courseId === courseId && n.type === type)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCurrentNote(): Note | undefined {
  if (!state.currentNoteId) return undefined;
  return state.notes.find(n => n.id === state.currentNoteId);
}

export function getNoteById(id: string): Note | undefined {
  return state.notes.find(n => n.id === id);
}

export function setCurrentNote(id: string | null): void {
  setState('currentNoteId', id);
}

export function createNote(courseId: string, type: NoteType, title?: string): Note {
  const now = Date.now();
  const newNote: Note = {
    id: generateId(),
    courseId,
    type,
    title: title || (type === 'classroom' ? '课堂实录' : '课前预习') + ' ' + formatDate(now),
    content: '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    isSynced: false,
    version: `v-${now}`,
    imageIds: [],
    comments: [],
  };
  
  noteStorage.save(newNote);
  setState('notes', [...state.notes, newNote]);
  setState('currentNoteId', newNote.id);
  
  addToSyncQueue(newNote.id, 'create', newNote);
  broadcastNoteUpdate(newNote);
  
  return newNote;
}

export function updateNote(id: string, updates: Partial<Note>): void {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  
  const updatedNote: Note = {
    ...note,
    ...updates,
    updatedAt: Date.now(),
    isSynced: false,
    version: `v-${Date.now()}`,
  };
  
  noteStorage.save(updatedNote);
  
  const index = state.notes.findIndex(n => n.id === id);
  if (index >= 0) {
    setState('notes', index, updatedNote);
  }
  
  addToSyncQueue(id, 'update', updatedNote);
  broadcastNoteUpdate(updatedNote);
}

export function deleteNote(id: string): void {
  noteStorage.delete(id);
  setState('notes', state.notes.filter(n => n.id !== id));
  
  if (state.currentNoteId === id) {
    setState('currentNoteId', null);
  }
  
  addToSyncQueue(id, 'delete', {});
  broadcastNoteDelete(id);
}

export function addTagToNote(noteId: string, tag: string): void {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;
  
  if (!note.tags.includes(tag)) {
    updateNote(noteId, { tags: [...note.tags, tag] });
  }
}

export function removeTagFromNote(noteId: string, tag: string): void {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;
  
  updateNote(noteId, { tags: note.tags.filter(t => t !== tag) });
}

export function addComment(noteId: string, content: string, author: string, authorRole: 'student' | 'teacher'): void {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;
  
  const newComment = {
    id: `comment-${Date.now()}`,
    noteId,
    content,
    author,
    authorRole,
    createdAt: Date.now(),
    isResolved: false,
  };
  
  updateNote(noteId, { comments: [...note.comments, newComment] });
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const noteStore = {
  state,
  loadNotes,
  getNotesByCourse,
  getNotesByCourseAndType,
  getCurrentNote,
  getNoteById,
  setCurrentNote,
  createNote,
  updateNote,
  deleteNote,
  addTagToNote,
  removeTagFromNote,
  addComment,
};

export default noteStore;
