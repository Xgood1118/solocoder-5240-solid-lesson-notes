import { createSignal, createEffect, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import {
  ArrowLeft, Share2, Download, MessageSquare,
  PenTool, Tag, Clock, Save, MoreHorizontal
} from 'lucide-solid';
import NoteList from '../components/note/NoteList';
import RichTextEditor from '../components/editor/RichTextEditor';
import CommentsPanel from '../components/note/CommentsPanel';
import ShareModal from '../components/note/ShareModal';
import DrawingCanvas from '../components/canvas/DrawingCanvas';
import ExportMenu from '../components/note/ExportMenu';
import SyncStatus from '../components/common/SyncStatus';
import TagBadge from '../components/common/TagBadge';
import {
  getCurrentNote, getNoteById, updateNote, setCurrentNote,
  addTagToNote, removeTagFromNote,
} from '../stores/noteStore';
import { getCourseById, getCourseColor } from '../stores/courseStore';
import { uiStore, setShowShareModal, setShowCanvas, setShowExportMenu } from '../stores/uiStore';
import { formatDateTime } from '../utils/storage/localStorage';
import imageDB from '../utils/storage/indexedDB';

const NoteEditor: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [showComments, setShowComments] = createSignal(false);
  const [tagInput, setTagInput] = createSignal('');
  const [showTagInput, setShowTagInput] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  
  const noteId = () => params.noteId;
  const courseId = () => params.courseId;
  
  const course = () => (courseId() ? getCourseById(courseId()!) : undefined);
  const note = () => (noteId() ? getNoteById(noteId()!) : undefined);
  
  createEffect(() => {
    if (noteId()) {
      setCurrentNote(noteId()!);
      const n = note();
      if (n) {
        setTitle(n.title);
        setContent(n.content);
      }
    }
  });
  
  onMount(() => {
    if (noteId()) {
      setCurrentNote(noteId()!);
    }
    loadImagesInContent();
  });
  
  const loadImagesInContent = async () => {
    if (!content()) return;
    
    let html = content();
    const imgRegex = /<img[^>]*data-image-id="([^"]*)"[^>]*>/g;
    let match;
    
    const replacements: Array<{ full: string; id: string }> = [];
    
    while ((match = imgRegex.exec(html)) !== null) {
      replacements.push({ full: match[0], id: match[1] });
    }
    
    for (const { full, id } of replacements) {
      try {
        const url = await imageDB.getImageUrl(id);
        if (url) {
          const newImg = full.replace(/src="[^"]*"/, `src="${url}"`);
          html = html.replace(full, newImg);
        }
      } catch (e) {
        console.error('Failed to load image:', e);
      }
    }
    
    if (html !== content()) {
      setContent(html);
    }
  };
  
  const handleTitleChange = (e: Event) => {
    setTitle((e.target as HTMLInputElement).value);
  };
  
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedSave();
  };
  
  let saveTimeout: number | null = null;
  
  const debouncedSave = () => {
    setSaving(true);
    
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    saveTimeout = window.setTimeout(() => {
      saveNote();
    }, 1000);
  };
  
  const saveNote = () => {
    if (!noteId()) return;
    
    updateNote(noteId()!, {
      title: title(),
      content: content(),
    });
    
    setSaving(false);
  };
  
  const handleAddTag = () => {
    if (!tagInput().trim() || !noteId()) return;
    
    addTagToNote(noteId()!, tagInput().trim());
    setTagInput('');
    setShowTagInput(false);
  };
  
  const handleRemoveTag = (tag: string) => {
    if (!noteId()) return;
    removeTagFromNote(noteId()!, tag);
  };
  
  const handleCanvasInsert = (dataUrl: string) => {
    if (!noteId()) return;
    
    fetch(dataUrl)
      .then(res => res.blob())
      .then(async blob => {
        const imageId = await imageDB.saveImageFromBlob(blob, noteId()!);
        const url = await imageDB.getImageUrl(imageId);
        
        if (url) {
          const imgHtml = `<p><img src="${url}" data-image-id="${imageId}" class="note-image" alt="手绘图"></p>`;
          setContent(prev => prev + imgHtml);
        }
      });
  };
  
  const courseColor = () => getCourseColor(courseId() || '');
  
  return (
    <div class="flex-1 flex overflow-hidden">
      <NoteList />
      
      <div class="flex-1 flex flex-col bg-white overflow-hidden">
        <div class="flex items-center gap-4 px-6 py-3 border-b border-gray-100">
          <button
            class="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => navigate(`/course/${courseId()}`)}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full"
              style={{ 'background-color': courseColor() }}
            />
            <span class="text-sm text-gray-600">{course()?.name}</span>
          </div>
          
          <div class="flex-1" />
          
          {saving() && (
            <span class="text-xs text-gray-400 flex items-center gap-1">
              <Save size={14} />
              保存中...
            </span>
          )}
          
          {!saving() && note() && (
            <SyncStatus />
          )}
          
          <div class="relative">
            <button
              class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setShowExportMenu(!uiStore.state.showExportMenu)}
              title="导入导出"
            >
              <Download size={20} />
            </button>
            <ExportMenu
              isOpen={uiStore.state.showExportMenu}
              onClose={() => setShowExportMenu(false)}
            />
          </div>
          
          <button
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setShowCanvas(true)}
            title="手写画板"
          >
            <PenTool size={20} />
          </button>
          
          <button
            class={`p-2 rounded-lg transition-colors ${
              showComments() ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setShowComments(!showComments())}
            title="批注"
          >
            <MessageSquare size={20} />
          </button>
          
          <button
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setShowShareModal(true)}
            title="分享"
          >
            <Share2 size={20} />
          </button>
        </div>
        
        <div class="px-8 pt-6 pb-4">
          <input
            type="text"
            class="w-full text-3xl font-bold text-gray-900 outline-none border-none bg-transparent placeholder:text-gray-300"
            placeholder="笔记标题"
            value={title()}
            onInput={handleTitleChange}
            onBlur={saveNote}
          />
          
          <div class="flex items-center gap-4 mt-3 text-sm text-gray-400">
            <span class="flex items-center gap-1">
              <Clock size={14} />
              {note() ? formatDateTime(note()!.updatedAt) : '未保存'}
            </span>
            
            <div class="flex items-center gap-2 flex-wrap">
              <Tag size={14} />
              {note()?.tags.map(tag => (
                <TagBadge
                  name={tag}
                  color="#6b7280"
                  size="sm"
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
              {showTagInput() ? (
                <input
                  type="text"
                  class="text-xs px-2 py-1 border border-gray-200 rounded-full w-20 outline-none focus:border-primary-400"
                  placeholder="标签名"
                  value={tagInput()}
                  onInput={(e) => setTagInput(e.target.value)}
                  onBlur={handleAddTag}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  autofocus
                />
              ) : (
                <button
                  class="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setShowTagInput(true)}
                >
                  + 添加标签
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-hidden flex">
          <div class="flex-1 overflow-hidden">
            <RichTextEditor
              content={content()}
              onChange={handleContentChange}
              noteId={noteId() || ''}
              placeholder="开始记录笔记...\n\n输入 $公式$ 添加行内公式，输入 $$公式$$ 添加块级公式"
            />
          </div>
          
          {showComments() && noteId() && (
            <CommentsPanel
              noteId={noteId()!}
              isOpen={showComments()}
              onClose={() => setShowComments(false)}
            />
          )}
        </div>
      </div>
      
      <ShareModal
        isOpen={uiStore.state.showShareModal}
        onClose={() => setShowShareModal(false)}
      />
      
      <DrawingCanvas
        isOpen={uiStore.state.showCanvas}
        onClose={() => setShowCanvas(false)}
        onInsert={handleCanvasInsert}
      />
    </div>
  );
};

export default NoteEditor;
