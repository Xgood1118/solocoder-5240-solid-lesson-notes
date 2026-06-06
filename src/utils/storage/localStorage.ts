import type { Note, Course, Tag, SyncQueueItem, ShareLink, Comment } from '../../types';

const STORAGE_KEYS = {
  NOTES: 'lesson_notes',
  COURSES: 'lesson_courses',
  TAGS: 'lesson_tags',
  SYNC_QUEUE: 'lesson_sync_queue',
  SHARE_LINKS: 'lesson_share_links',
  SETTINGS: 'lesson_settings',
  USER: 'lesson_user',
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export const noteStorage = {
  getAll(): Note[] {
    return getFromStorage<Note[]>(STORAGE_KEYS.NOTES, []);
  },

  getById(id: string): Note | undefined {
    const notes = this.getAll();
    return notes.find(n => n.id === id);
  },

  getByCourse(courseId: string): Note[] {
    const notes = this.getAll();
    return notes.filter(n => n.courseId === courseId);
  },

  save(note: Note): void {
    const notes = this.getAll();
    const index = notes.findIndex(n => n.id === note.id);
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.push(note);
    }
    setToStorage(STORAGE_KEYS.NOTES, notes);
  },

  delete(id: string): void {
    const notes = this.getAll().filter(n => n.id !== id);
    setToStorage(STORAGE_KEYS.NOTES, notes);
  },

  search(keyword: string): Note[] {
    const notes = this.getAll();
    const lowerKeyword = keyword.toLowerCase();
    return notes.filter(note => {
      const titleMatch = note.title.toLowerCase().includes(lowerKeyword);
      const contentMatch = stripHtml(note.content).toLowerCase().includes(lowerKeyword);
      const tagMatch = note.tags.some(t => t.toLowerCase().includes(lowerKeyword));
      const latexMatch = extractLatex(note.content).some(latex =>
        latex.toLowerCase().includes(lowerKeyword)
      );
      return titleMatch || contentMatch || tagMatch || latexMatch;
    }).sort((a, b) => {
      const aScore = calculateRelevance(a, lowerKeyword);
      const bScore = calculateRelevance(b, lowerKeyword);
      return bScore - aScore;
    });
  },
};

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function extractLatex(html: string): string[] {
  const results: string[] = [];
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineRegex = /\$([^$\n]+?)\$/g;
  
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    results.push(match[1]);
  }
  while ((match = inlineRegex.exec(html)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function calculateRelevance(note: Note, keyword: string): number {
  let score = 0;
  const titleLower = note.title.toLowerCase();
  const contentText = stripHtml(note.content).toLowerCase();
  
  const titleCount = (titleLower.match(new RegExp(keyword, 'g')) || []).length;
  score += titleCount * 10;
  
  const contentCount = (contentText.match(new RegExp(keyword, 'g')) || []).length;
  score += contentCount;
  
  const latexList = extractLatex(note.content);
  const latexCount = latexList.filter(l => l.toLowerCase().includes(keyword)).length;
  score += latexCount * 5;
  
  return score;
}

export const courseStorage = {
  getAll(): Course[] {
    return getFromStorage<Course[]>(STORAGE_KEYS.COURSES, getDefaultCourses());
  },

  getById(id: string): Course | undefined {
    return this.getAll().find(c => c.id === id);
  },

  save(course: Course): void {
    const courses = this.getAll();
    const index = courses.findIndex(c => c.id === course.id);
    if (index >= 0) {
      courses[index] = course;
    } else {
      courses.push(course);
    }
    setToStorage(STORAGE_KEYS.COURSES, courses);
  },

  getCurrentCourse(): Course | null {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const courses = this.getAll();

    for (const course of courses) {
      for (const schedule of course.schedule) {
        if (schedule.dayOfWeek === dayOfWeek) {
          const [startH, startM] = schedule.startTime.split(':').map(Number);
          const [endH, endM] = schedule.endTime.split(':').map(Number);
          const startTime = startH * 60 + startM;
          const endTime = endH * 60 + endM;
          
          if (currentTime >= startTime && currentTime <= endTime) {
            return course;
          }
        }
      }
    }
    return null;
  },

  getTodayCourses(): Course[] {
    const dayOfWeek = new Date().getDay();
    const courses = this.getAll();
    return courses.filter(course =>
      course.schedule.some(s => s.dayOfWeek === dayOfWeek)
    ).sort((a, b) => {
      const aTime = Math.min(...a.schedule.filter(s => s.dayOfWeek === dayOfWeek).map(s => {
        const [h, m] = s.startTime.split(':').map(Number);
        return h * 60 + m;
      }));
      const bTime = Math.min(...b.schedule.filter(s => s.dayOfWeek === dayOfWeek).map(s => {
        const [h, m] = s.startTime.split(':').map(Number);
        return h * 60 + m;
      }));
      return aTime - bTime;
    });
  },
};

function getDefaultCourses(): Course[] {
  return [
    {
      id: 'course-1',
      name: '数学',
      color: '#3b82f6',
      teacher: '张老师',
      schedule: [
        { dayOfWeek: 1, period: 2, startTime: '08:55', endTime: '09:40' },
        { dayOfWeek: 2, period: 1, startTime: '08:00', endTime: '08:45' },
        { dayOfWeek: 3, period: 3, startTime: '10:00', endTime: '10:45' },
        { dayOfWeek: 5, period: 1, startTime: '08:00', endTime: '08:45' },
      ],
    },
    {
      id: 'course-2',
      name: '语文',
      color: '#ef4444',
      teacher: '李老师',
      schedule: [
        { dayOfWeek: 1, period: 1, startTime: '08:00', endTime: '08:45' },
        { dayOfWeek: 3, period: 2, startTime: '08:55', endTime: '09:40' },
        { dayOfWeek: 4, period: 4, startTime: '10:55', endTime: '11:40' },
        { dayOfWeek: 5, period: 3, startTime: '10:00', endTime: '10:45' },
      ],
    },
    {
      id: 'course-3',
      name: '英语',
      color: '#10b981',
      teacher: '王老师',
      schedule: [
        { dayOfWeek: 1, period: 3, startTime: '10:00', endTime: '10:45' },
        { dayOfWeek: 3, period: 1, startTime: '08:00', endTime: '08:45' },
        { dayOfWeek: 4, period: 3, startTime: '10:00', endTime: '10:45' },
        { dayOfWeek: 5, period: 2, startTime: '08:55', endTime: '09:40' },
      ],
    },
    {
      id: 'course-4',
      name: '物理',
      color: '#8b5cf6',
      teacher: '刘老师',
      schedule: [
        { dayOfWeek: 1, period: 4, startTime: '10:55', endTime: '11:40' },
        { dayOfWeek: 4, period: 1, startTime: '08:00', endTime: '08:45' },
      ],
    },
    {
      id: 'course-5',
      name: '化学',
      color: '#f59e0b',
      teacher: '陈老师',
      schedule: [
        { dayOfWeek: 2, period: 2, startTime: '08:55', endTime: '09:40' },
        { dayOfWeek: 4, period: 2, startTime: '08:55', endTime: '09:40' },
      ],
    },
    {
      id: 'course-6',
      name: '生物',
      color: '#06b6d4',
      teacher: '赵老师',
      schedule: [
        { dayOfWeek: 2, period: 3, startTime: '10:00', endTime: '10:45' },
        { dayOfWeek: 4, period: 3, startTime: '10:00', endTime: '10:45' },
      ],
    },
    {
      id: 'course-7',
      name: '历史',
      color: '#ec4899',
      teacher: '孙老师',
      schedule: [
        { dayOfWeek: 2, period: 4, startTime: '10:55', endTime: '11:40' },
      ],
    },
    {
      id: 'course-8',
      name: '地理',
      color: '#14b8a6',
      teacher: '周老师',
      schedule: [
        { dayOfWeek: 4, period: 4, startTime: '10:55', endTime: '11:40' },
      ],
    },
    {
      id: 'course-9',
      name: '体育',
      color: '#84cc16',
      teacher: '吴老师',
      schedule: [
        { dayOfWeek: 3, period: 4, startTime: '10:55', endTime: '11:40' },
      ],
    },
  ];
}

export const tagStorage = {
  getAll(): Tag[] {
    return getFromStorage<Tag[]>(STORAGE_KEYS.TAGS, getDefaultTags());
  },

  save(tag: Tag): void {
    const tags = this.getAll();
    const index = tags.findIndex(t => t.id === tag.id);
    if (index >= 0) {
      tags[index] = tag;
    } else {
      tags.push(tag);
    }
    setToStorage(STORAGE_KEYS.TAGS, tags);
  },

  delete(id: string): void {
    const tags = this.getAll().filter(t => t.id !== id);
    setToStorage(STORAGE_KEYS.TAGS, tags);
  },
};

function getDefaultTags(): Tag[] {
  return [
    { id: 'tag-1', name: '重点', color: '#ef4444' },
    { id: 'tag-2', name: '易错点', color: '#f59e0b' },
    { id: 'tag-3', name: '二次函数', color: '#3b82f6' },
    { id: 'tag-4', name: '待复习', color: '#8b5cf6' },
  ];
}

export const syncQueueStorage = {
  getAll(): SyncQueueItem[] {
    return getFromStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  getPending(): SyncQueueItem[] {
    return this.getAll().filter(item => item.status === 'pending' || item.status === 'failed');
  },

  add(item: SyncQueueItem): void {
    const items = this.getAll();
    items.push(item);
    setToStorage(STORAGE_KEYS.SYNC_QUEUE, items);
  },

  update(id: string, updates: Partial<SyncQueueItem>): void {
    const items = this.getAll();
    const index = items.findIndex(i => i.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...updates };
      setToStorage(STORAGE_KEYS.SYNC_QUEUE, items);
    }
  },

  remove(id: string): void {
    const items = this.getAll().filter(i => i.id !== id);
    setToStorage(STORAGE_KEYS.SYNC_QUEUE, items);
  },
};

export const shareStorage = {
  getAll(): ShareLink[] {
    return getFromStorage<ShareLink[]>(STORAGE_KEYS.SHARE_LINKS, []);
  },

  getById(id: string): ShareLink | undefined {
    return this.getAll().find(s => s.id === id);
  },

  save(link: ShareLink): void {
    const links = this.getAll();
    links.push(link);
    setToStorage(STORAGE_KEYS.SHARE_LINKS, links);
  },

  delete(id: string): void {
    const links = this.getAll().filter(l => l.id !== id);
    setToStorage(STORAGE_KEYS.SHARE_LINKS, links);
  },
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const dateStr = formatDate(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

export function getDayName(dayOfWeek: number): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dayOfWeek] || '';
}
