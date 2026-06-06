import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code,
  Image, Minus, Link,
} from 'lucide-solid';
import {
  formatBold, formatItalic, formatUnderline, formatStrikethrough,
  formatHeading, formatParagraph,
  formatUnorderedList, formatOrderedList,
  formatQuote, formatCodeBlock, formatInlineCode,
  insertHorizontalRule, insertLink, insertImage,
  isFormatActive, getBlockFormat, saveSelection, restoreSelection,
} from '../../utils/editor/richText';
import { renderAllMath } from '../../utils/editor/katex';
import { highlightAllCodeBlocks } from '../../utils/editor/codeHighlight';
import imageDB from '../../utils/storage/indexedDB';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  noteId: string;
  placeholder?: string;
}

const RichTextEditor: Component<RichTextEditorProps> = (props) => {
  let editorRef: HTMLDivElement | undefined;
  const [showLinkModal, setShowLinkModal] = createSignal(false);
  const [linkUrl, setLinkUrl] = createSignal('');
  const [linkText, setLinkText] = createSignal('');
  const [savedRange, setSavedRange] = createSignal<Range | null>(null);
  const [showCodeLangModal, setShowCodeLangModal] = createSignal(false);
  const [codeLanguage, setCodeLanguage] = createSignal('javascript');
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);

  let mathDebounceTimer: number | null = null;

  const handleInput = () => {
    if (!editorRef) return;
    
    const content = editorRef.innerHTML;
    props.onChange(content);
    
    scheduleMathRender();
  };

  const scheduleMathRender = () => {
    if (mathDebounceTimer) {
      clearTimeout(mathDebounceTimer);
    }
    mathDebounceTimer = window.setTimeout(() => {
      renderMathInEditor();
    }, 500);
  };

  const renderMathInEditor = () => {
    if (!editorRef) return;
    
    const selection = saveSelection();
    
    const html = editorRef.innerHTML;
    const rendered = renderAllMath(html);
    
    if (rendered !== html) {
      editorRef.innerHTML = rendered;
      highlightAllCodeBlocksInEditor();
    }
    
    if (selection) {
      try {
        restoreSelection(selection);
      } catch {}
    }
  };

  const highlightAllCodeBlocksInEditor = () => {
    if (!editorRef) return;
    const highlighted = highlightAllCodeBlocks(editorRef.innerHTML);
    if (highlighted !== editorRef.innerHTML) {
      const selection = saveSelection();
      editorRef.innerHTML = highlighted;
      if (selection) {
        try {
          restoreSelection(selection);
        } catch {}
      }
    }
  };

  const handleToolbarClick = (action: string) => {
    editorRef?.focus();
    setSavedRange(saveSelection());
    
    switch (action) {
      case 'bold':
        formatBold();
        break;
      case 'italic':
        formatItalic();
        break;
      case 'underline':
        formatUnderline();
        break;
      case 'strikethrough':
        formatStrikethrough();
        break;
      case 'h1':
        formatHeading(1);
        break;
      case 'h2':
        formatHeading(2);
        break;
      case 'h3':
        formatHeading(3);
        break;
      case 'p':
        formatParagraph();
        break;
      case 'ul':
        formatUnorderedList();
        break;
      case 'ol':
        formatOrderedList();
        break;
      case 'quote':
        formatQuote();
        break;
      case 'code':
        formatInlineCode();
        break;
      case 'codeblock':
        setShowCodeLangModal(true);
        break;
      case 'hr':
        insertHorizontalRule();
        break;
      case 'link':
        setShowLinkModal(true);
        break;
      case 'image':
        handleImageUpload();
        break;
    }
    
    handleInput();
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      await uploadImages(Array.from(files));
    };
    
    input.click();
  };

  const uploadImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const blobs = files.map(f => f as Blob);
      const ids = await imageDB.saveImagesFromBlobs(blobs, props.noteId, (current, total) => {
        setUploadProgress(Math.round((current / total) * 100));
      });
      
      for (const id of ids) {
        const url = await imageDB.getImageUrl(id);
        if (url) {
          insertImage(url, '图片', id);
        }
      }
      
      handleInput();
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      
      const blobs: Blob[] = [];
      for (const item of imageItems) {
        const blob = item.getAsFile();
        if (blob) blobs.push(blob);
      }
      
      if (blobs.length > 0) {
        await uploadImages(blobs as File[]);
      }
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    
    const files = e.dataTransfer?.files;
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      await uploadImages(imageFiles);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleLinkInsert = () => {
    if (savedRange()) {
      restoreSelection(savedRange());
    }
    insertLink(linkUrl(), linkText() || linkUrl());
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    handleInput();
  };

  const handleCodeBlockInsert = () => {
    if (savedRange()) {
      restoreSelection(savedRange());
    }
    formatCodeBlock(codeLanguage());
    setShowCodeLangModal(false);
    handleInput();
    setTimeout(highlightAllCodeBlocksInEditor, 50);
  };

  const isActive = (command: string) => {
    return isFormatActive(command);
  };

  const blockFormat = () => {
    return getBlockFormat().toLowerCase();
  };

  onMount(() => {
    if (editorRef) {
      editorRef.innerHTML = props.content;
      renderMathInEditor();
      highlightAllCodeBlocksInEditor();
    }
    
    editorRef?.addEventListener('paste', handlePaste as any);
    editorRef?.addEventListener('drop', handleDrop as any);
    editorRef?.addEventListener('dragover', handleDragOver as any);
  });

  onCleanup(() => {
    editorRef?.removeEventListener('paste', handlePaste as any);
    editorRef?.removeEventListener('drop', handleDrop as any);
    editorRef?.removeEventListener('dragover', handleDragOver as any);
    
    if (mathDebounceTimer) {
      clearTimeout(mathDebounceTimer);
    }
  });

  createEffect(() => {
    if (editorRef && editorRef.innerHTML !== props.content) {
      const selection = saveSelection();
      editorRef.innerHTML = props.content;
      renderMathInEditor();
      if (selection) {
        try {
          restoreSelection(selection);
        } catch {}
      }
    }
  });

  const ToolButton: Component<{ title: string; active?: boolean; onClick: () => void; children: any }> = (p) => (
    <button
      type="button"
      title={p.title}
      class={`p-2 rounded-lg transition-colors ${p.active ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
      onClick={p.onClick}
    >
      {p.children}
    </button>
  );

  const Divider = () => <div class="w-px h-6 bg-gray-200 mx-1" />;

  return (
    <div class="flex flex-col h-full">
      <div class="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
        <ToolButton title="加粗" active={isActive('bold')} onClick={() => handleToolbarClick('bold')}>
          <Bold size={18} />
        </ToolButton>
        <ToolButton title="斜体" active={isActive('italic')} onClick={() => handleToolbarClick('italic')}>
          <Italic size={18} />
        </ToolButton>
        <ToolButton title="下划线" active={isActive('underline')} onClick={() => handleToolbarClick('underline')}>
          <Underline size={18} />
        </ToolButton>
        <ToolButton title="删除线" active={isActive('strikeThrough')} onClick={() => handleToolbarClick('strikethrough')}>
          <Strikethrough size={18} />
        </ToolButton>
        
        <Divider />
        
        <ToolButton title="一级标题" active={blockFormat() === 'h1'} onClick={() => handleToolbarClick('h1')}>
          <Heading1 size={18} />
        </ToolButton>
        <ToolButton title="二级标题" active={blockFormat() === 'h2'} onClick={() => handleToolbarClick('h2')}>
          <Heading2 size={18} />
        </ToolButton>
        <ToolButton title="三级标题" active={blockFormat() === 'h3'} onClick={() => handleToolbarClick('h3')}>
          <Heading3 size={18} />
        </ToolButton>
        
        <Divider />
        
        <ToolButton title="无序列表" active={isActive('insertUnorderedList')} onClick={() => handleToolbarClick('ul')}>
          <List size={18} />
        </ToolButton>
        <ToolButton title="有序列表" active={isActive('insertOrderedList')} onClick={() => handleToolbarClick('ol')}>
          <ListOrdered size={18} />
        </ToolButton>
        <ToolButton title="引用" active={blockFormat() === 'blockquote'} onClick={() => handleToolbarClick('quote')}>
          <Quote size={18} />
        </ToolButton>
        
        <Divider />
        
        <ToolButton title="行内代码" onClick={() => handleToolbarClick('code')}>
          <Code size={18} />
        </ToolButton>
        <ToolButton title="代码块" onClick={() => handleToolbarClick('codeblock')}>
          <div class="text-xs font-mono font-bold">{ }</div>
        </ToolButton>
        
        <Divider />
        
        <ToolButton title="插入链接" onClick={() => handleToolbarClick('link')}>
          <Link size={18} />
        </ToolButton>
        <ToolButton title="插入图片" onClick={() => handleToolbarClick('image')}>
          <Image size={18} />
        </ToolButton>
        <ToolButton title="分割线" onClick={() => handleToolbarClick('hr')}>
          <Minus size={18} />
        </ToolButton>
        
        {isUploading() && (
          <div class="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 transition-all"
                style={{ width: `${uploadProgress()}%` }}
              />
            </div>
            <span>上传中 {uploadProgress()}%</span>
          </div>
        )}
      </div>
      
      <div
        ref={editorRef}
        class="flex-1 p-6 overflow-y-auto editor-content bg-white"
        contentEditable={true}
        onInput={handleInput}
        spellcheck={false}
        data-placeholder={props.placeholder || '开始记录笔记...'}
      />
      
      {showLinkModal() && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/30" onClick={() => setShowLinkModal(false)} />
          <div class="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 class="text-lg font-semibold mb-4">插入链接</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">链接地址</label>
                <input
                  type="url"
                  class="input"
                  placeholder="https://"
                  value={linkUrl()}
                  onInput={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">链接文字</label>
                <input
                  type="text"
                  class="input"
                  placeholder="可选"
                  value={linkText()}
                  onInput={(e) => setLinkText(e.target.value)}
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button class="btn-secondary" onClick={() => setShowLinkModal(false)}>取消</button>
              <button class="btn-primary" onClick={handleLinkInsert}>插入</button>
            </div>
          </div>
        </div>
      )}
      
      {showCodeLangModal() && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/30" onClick={() => setShowCodeLangModal(false)} />
          <div class="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 class="text-lg font-semibold mb-4">选择语言</h3>
            <select
              class="input"
              value={codeLanguage()}
              onChange={(e) => setCodeLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
              <option value="json">JSON</option>
            </select>
            <div class="flex justify-end gap-2 mt-6">
              <button class="btn-secondary" onClick={() => setShowCodeLangModal(false)}>取消</button>
              <button class="btn-primary" onClick={handleCodeBlockInsert}>插入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
