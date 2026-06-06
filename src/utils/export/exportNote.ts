import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Note } from '../../types';

export function exportToMarkdown(note: Note): string {
  const htmlContent = note.content;
  const markdown = htmlToMarkdown(htmlContent);
  
  let result = `# ${note.title}\n\n`;
  result += `> 课程: ${getCourseName(note.courseId)}\n`;
  result += `> 创建时间: ${formatDate(note.createdAt)}\n`;
  result += `> 更新时间: ${formatDate(note.updatedAt)}\n\n`;
  
  if (note.tags.length > 0) {
    result += `标签: ${note.tags.join(', ')}\n\n`;
    result += '---\n\n';
  }
  
  result += markdown;
  
  return result;
}

function htmlToMarkdown(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  let markdown = '';
  
  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
          return `# ${el.textContent}\n\n`;
        case 'h2':
          return `## ${el.textContent}\n\n`;
        case 'h3':
          return `### ${el.textContent}\n\n`;
        case 'p':
          return `${processChildren(el)}\n\n`;
        case 'strong':
        case 'b':
          return `**${el.textContent}**`;
        case 'em':
        case 'i':
          return `*${el.textContent}*`;
        case 'u':
          return `<u>${el.textContent}</u>`;
        case 'del':
        case 's':
          return `~~${el.textContent}~~`;
        case 'code':
          return `\`${el.textContent}\``;
        case 'pre':
          return `\n\`\`\`\n${el.textContent}\n\`\`\`\n\n`;
        case 'blockquote':
          return `> ${el.textContent?.replace(/\n/g, '\n> ')}\n\n`;
        case 'ul':
          return processList(el, false) + '\n';
        case 'ol':
          return processList(el, true) + '\n';
        case 'li':
          return `${el.textContent}\n`;
        case 'a':
          return `[${el.textContent}](${(el as HTMLAnchorElement).href})`;
        case 'img':
          return `![${(el as HTMLImageElement).alt}](${(el as HTMLImageElement).src})\n\n`;
        case 'br':
          return '\n';
        case 'hr':
          return '\n---\n\n';
        default:
          return processChildren(el);
      }
    }
    
    return '';
  }
  
  function processChildren(el: HTMLElement): string {
    let result = '';
    el.childNodes.forEach(child => {
      result += processNode(child);
    });
    return result;
  }
  
  function processList(el: HTMLElement, ordered: boolean): string {
    let result = '';
    const items = el.querySelectorAll('li');
    items.forEach((li, index) => {
      const prefix = ordered ? `${index + 1}. ` : '- ';
      result += `${prefix}${li.textContent}\n`;
    });
    return result;
  }
  
  markdown = processChildren(tmp);
  
  return markdown;
}

export function exportToHtml(note: Note): string {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.7;
      color: #333;
      background: #fff;
    }
    h1 { font-size: 2em; margin-bottom: 0.5em; color: #1a1a1a; }
    h2 { font-size: 1.5em; margin-top: 1.5em; color: #1a1a1a; }
    h3 { font-size: 1.25em; margin-top: 1.25em; color: #1a1a1a; }
    .meta {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 1px solid #eee;
    }
    .tags { margin-top: 1em; }
    .tag {
      display: inline-block;
      padding: 2px 10px;
      background: #eef2ff;
      color: #4f46e5;
      border-radius: 20px;
      font-size: 0.85em;
      margin-right: 8px;
    }
    blockquote {
      border-left: 4px solid #1e3a5f;
      padding-left: 1em;
      margin: 1em 0;
      color: #666;
      background: #f9fafb;
      padding-top: 0.5em;
      padding-bottom: 0.5em;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code { background: transparent; padding: 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    ul, ol { padding-left: 1.5em; }
    li { margin-bottom: 0.25em; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="meta">
    <p>创建时间: ${formatDate(note.createdAt)}</p>
    <p>更新时间: ${formatDate(note.updatedAt)}</p>
    ${note.tags.length > 0 ? `<div class="tags">${note.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
  </div>
  <div class="content">
    ${note.content}
  </div>
</body>
</html>`;
  
  return html;
}

export async function exportToPdf(note: Note, contentElement: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = pdfWidth / imgWidth;
    const height = imgHeight * ratio;
    
    let heightLeft = height;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
    heightLeft -= pdfHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - height;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`${note.title}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

export function downloadFile(content: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

function getCourseName(courseId: string): string {
  return courseId;
}

export default {
  exportToMarkdown,
  exportToHtml,
  exportToPdf,
  downloadFile,
};
