import hljs from 'highlight.js';

export function highlightCode(code: string, language?: string): string {
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return code;
  }
}

export function highlightAllCodeBlocks(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const codeBlocks = doc.querySelectorAll('pre code');
  
  codeBlocks.forEach(block => {
    const code = block.textContent || '';
    const langClass = Array.from(block.classList).find(c => c.startsWith('language-'));
    const language = langClass ? langClass.replace('language-', '') : undefined;
    
    block.innerHTML = highlightCode(code, language);
    block.classList.add('hljs');
  });
  
  return doc.body.innerHTML;
}

export function wrapCodeBlock(code: string, language: string = ''): string {
  const langClass = language ? `class="language-${language}"` : '';
  return `<pre><code ${langClass}>${escapeHtml(code)}</code></pre>`;
}

export function wrapInlineCode(code: string): string {
  return `<code>${escapeHtml(code)}</code>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

export default {
  highlightCode,
  highlightAllCodeBlocks,
  wrapCodeBlock,
  wrapInlineCode,
};
