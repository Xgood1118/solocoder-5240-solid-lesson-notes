import katex from 'katex';

export function renderInlineMath(text: string): string {
  return text.replace(/\$([^$\n]+?)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      });
    } catch {
      return match;
    }
  });
}

export function renderBlockMath(text: string): string {
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    try {
      const rendered = katex.renderToString(latex.trim(), {
        throwOnError: false,
        displayMode: true,
        output: 'html',
      });
      return `<div class="block-math">${rendered}</div>`;
    } catch {
      return `<div class="math-error">公式渲染失败: ${match}</div>`;
    }
  });
}

export function renderAllMath(html: string): string {
  let result = renderBlockMath(html);
  result = renderInlineMath(result);
  return result;
}

export function extractLatexFromHtml(html: string): string[] {
  const results: string[] = [];
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineRegex = /\$([^$\n]+?)\$/g;
  
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    results.push(match[1].trim());
  }
  while ((match = inlineRegex.exec(html)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

export function safeRenderLatex(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
  } catch (e) {
    return `<span class="text-red-500 text-sm">${latex}</span>`;
  }
}

export default {
  renderInlineMath,
  renderBlockMath,
  renderAllMath,
  extractLatexFromHtml,
  safeRenderLatex,
};
