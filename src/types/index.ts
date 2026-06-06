export interface Course {
  id: string;
  name: string;
  color: string;
  teacher: string;
  schedule: CourseSchedule[];
}

export interface CourseSchedule {
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
}

export type NoteType = 'classroom' | 'preview';

export interface Note {
  id: string;
  courseId: string;
  type: NoteType;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
  version: string;
  imageIds: string[];
  comments: Comment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ImageRecord {
  id: string;
  noteId: string;
  data?: Blob;
  type: string;
  size: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  noteId: string;
  content: string;
  author: string;
  authorRole: 'student' | 'teacher';
  createdAt: number;
  isResolved: boolean;
  targetText?: string;
}

export interface SyncQueueItem {
  id: string;
  noteId: string;
  action: 'create' | 'update' | 'delete';
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  createdAt: number;
  payload: Partial<Note>;
}

export interface ShareLink {
  id: string;
  noteId: string;
  type: 'readonly' | 'copy';
  createdAt: number;
  expireAt?: number;
}

export interface ConflictInfo {
  noteId: string;
  localVersion: Note;
  remoteVersion: Note;
  timestamp: number;
}

export type EditorFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'code' | 'codeblock';

export interface DrawingPath {
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface CanvasState {
  paths: DrawingPath[];
  currentPath: DrawingPath | null;
}
