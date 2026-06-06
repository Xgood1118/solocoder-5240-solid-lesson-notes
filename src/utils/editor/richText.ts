export function execCommand(command: string, value?: string): void {
  document.execCommand(command, false, value);
}

export function formatBold(): void {
  execCommand('bold');
}

export function formatItalic(): void {
  execCommand('italic');
}

export function formatUnderline(): void {
  execCommand('underline');
}

export function formatStrikethrough(): void {
  execCommand('strikeThrough');
}

export function formatHeading(level: 1 | 2 | 3): void {
  execCommand('formatBlock', `h${level}`);
}

export function formatParagraph(): void {
  execCommand('formatBlock', 'p');
}

export function formatUnorderedList(): void {
  execCommand('insertUnorderedList');
}

export function formatOrderedList(): void {
  execCommand('insertOrderedList');
}

export function formatQuote(): void {
  execCommand('formatBlock', 'blockquote');
}

export function formatCodeBlock(language: string = ''): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  if (language) {
    code.className = `language-${language}`;
  }
  code.textContent = selectedText || '// 在这里输入代码';
  pre.appendChild(code);
  
  range.deleteContents();
  range.insertNode(pre);
  
  range.setStartAfter(pre);
  range.setEndAfter(pre);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function formatInlineCode(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  
  const code = document.createElement('code');
  code.textContent = selectedText || '代码';
  
  range.deleteContents();
  range.insertNode(code);
  
  range.setStartAfter(code);
  range.setEndAfter(code);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function insertHorizontalRule(): void {
  execCommand('insertHorizontalRule');
}

export function insertLink(url: string, text?: string): void {
  const selection = window.getSelection();
  const linkText = text || selection?.toString() || url;
  
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = linkText;
  
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(a);
  }
}

export function insertImage(src: string, alt: string = '', imageId: string = ''): void {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = 'note-image';
  img.dataset.imageId = imageId;
  
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
    
    const br = document.createElement('br');
    img.after(br);
    
    range.setStartAfter(br);
    range.setEndAfter(br);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function getSelectionHtml(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return '';
  
  const range = selection.getRangeAt(0);
  const div = document.createElement('div');
  div.appendChild(range.cloneContents());
  return div.innerHTML;
}

export function isFormatActive(command: string): boolean {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

export function getBlockFormat(): string {
  try {
    return document.queryCommandValue('formatBlock') || '';
  } catch {
    return '';
  }
}

export function saveSelection(): Range | null {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    return selection.getRangeAt(0).cloneRange();
  }
  return null;
}

export function restoreSelection(range: Range | null): void {
  if (!range) return;
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export default {
  formatBold,
  formatItalic,
  formatUnderline,
  formatStrikethrough,
  formatHeading,
  formatParagraph,
  formatUnorderedList,
  formatOrderedList,
  formatQuote,
  formatCodeBlock,
  formatInlineCode,
  insertHorizontalRule,
  insertLink,
  insertImage,
  getSelectionHtml,
  isFormatActive,
  getBlockFormat,
  saveSelection,
  restoreSelection,
};
