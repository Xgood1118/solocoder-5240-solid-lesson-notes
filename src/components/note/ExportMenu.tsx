import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { Download, Upload, FileText, Code, FileType, X } from 'lucide-solid';
import { exportToMarkdown, exportToHtml, exportToPdf, downloadFile } from '../../utils/export/exportNote';
import { importNoteFromFile } from '../../utils/export/importNote';
import { getCurrentNote, updateNote, createNote } from '../../stores/noteStore';
import { uiStore, setShowExportMenu } from '../../stores/uiStore';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportMenu: Component<ExportMenuProps> = (props) => {
  const [importing, setImporting] = createSignal(false);
  const [importError, setImportError] = createSignal('');
  
  const note = () => getCurrentNote();
  
  const handleExportMarkdown = () => {
    if (!note()) return;
    const markdown = exportToMarkdown(note()!);
    downloadFile(markdown, `${note()!.title}.md`, 'text/markdown');
    props.onClose();
  };
  
  const handleExportHtml = () => {
    if (!note()) return;
    const html = exportToHtml(note()!);
    downloadFile(html, `${note()!.title}.html`, 'text/html');
    props.onClose();
  };
  
  const handleExportPdf = async () => {
    if (!note()) return;
    const content = document.querySelector('.editor-content') as HTMLElement;
    if (content) {
      try {
        await exportToPdf(note()!, content);
      } catch (err) {
        console.error('PDF export failed:', err);
      }
    }
    props.onClose();
  };
  
  const handleFileImport = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setImportError('');
    
    try {
      const currentNote = note();
      const courseId = currentNote?.courseId || 'course-1';
      const noteType = currentNote?.type || 'classroom';
      
      const importedNote = await importNoteFromFile(file, courseId, noteType);
      
      if (currentNote) {
        updateNote(currentNote.id, {
          title: importedNote.title,
          content: importedNote.content,
        });
      }
      
      props.onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };
  
  if (!props.isOpen) return null;
  
  return (
    <div class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 fade-in">
      <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        导出
      </div>
      
      <button
        class="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        onClick={handleExportMarkdown}
      >
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <FileText size={16} class="text-gray-600" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">Markdown</p>
          <p class="text-xs text-gray-400">.md 文件</p>
        </div>
      </button>
      
      <button
        class="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        onClick={handleExportHtml}
      >
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Code size={16} class="text-blue-600" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">HTML</p>
          <p class="text-xs text-gray-400">带样式网页</p>
        </div>
      </button>
      
      <button
        class="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        onClick={handleExportPdf}
      >
        <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
          <FileType size={16} class="text-red-500" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">PDF</p>
          <p class="text-xs text-gray-400">打印讲义格式</p>
        </div>
      </button>
      
      <div class="my-2 border-t border-gray-100" />
      
      <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        导入
      </div>
      
      <label class="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
        <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <Upload size={16} class="text-green-600" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">导入文件</p>
          <p class="text-xs text-gray-400">.md / .docx</p>
        </div>
        <input
          type="file"
          class="hidden"
          accept=".md,.markdown,.docx"
          onChange={handleFileImport}
        />
      </label>
      
      {importError() && (
        <div class="px-3 py-2 text-xs text-red-500 bg-red-50">
          {importError()}
        </div>
      )}
      
      {importing() && (
        <div class="px-3 py-2 text-xs text-gray-500">
          导入中...
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
