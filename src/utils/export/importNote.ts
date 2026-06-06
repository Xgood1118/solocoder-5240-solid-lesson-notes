import mammoth from 'mammoth';
import type { Note } from '../../types';
import { generateId } from '../storage/localStorage';

export async function importMarkdown(content: string, courseId: string, noteType: 'classroom' | 'preview'): Promise<Note> {
  const lines = content.split('\n');
  let title = '未命名笔记';
  let bodyLines = lines;
  
  if (lines[0]?.startsWith('# ')) {
    title = lines[0].substring(2).trim();
    bodyLines = lines.slice(1);
  }
  
  const html = markdownToHtml(bodyLines.join('\n'));
  
  const now = Date.now();
  const note: Note = {
    id: generateId(),
    courseId,
    type: noteType,
    title,
    content: html,
    tags: [],
    createdAt: now,
    updatedAt: now,
    isSynced: false,
    version: `v-${now}`,
    imageIds: [],
    comments: [],
  };
  
  return note;
}

function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  
  html = html.replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\n<ul>/g, '');
  
  html = html.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
  html = html.replace(/<\/ol>\n<ol>/g, '');
  
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  html = html.replace(/<p><h/g, '<h');
  html = html.replace(/<\/h\d><\/p>/g, match => {
    const level = match.match(/h\d/)?.[0];
    return `</${level}>`;
  });
  
  return html;
}

export async function importWord(file: File, courseId: string, noteType: 'classroom' | 'preview'): Promise<Note> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        let title = file.name.replace('.docx', '').replace('.doc', '');
        const firstH1 = doc.querySelector('h1');
        if (firstH1) {
          title = firstH1.textContent || title;
          firstH1.remove();
        }
        
        const now = Date.now();
        const note: Note = {
          id: generateId(),
          courseId,
          type: noteType,
          title,
          content: doc.body.innerHTML,
          tags: [],
          createdAt: now,
          updatedAt: now,
          isSynced: false,
          version: `v-${now}`,
          imageIds: [],
          comments: [],
        };
        
        resolve(note);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function importNoteFromFile(
  file: File,
  courseId: string,
  noteType: 'classroom' | 'preview'
): Promise<Note> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'md':
    case 'markdown':
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importMarkdown(content, courseId, noteType).then(resolve).catch(reject);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
      
    case 'docx':
      return importWord(file, courseId, noteType);
      
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

export default {
  importMarkdown,
  importWord,
  importNoteFromFile,
};
