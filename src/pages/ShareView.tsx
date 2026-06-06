import { createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { ArrowLeft, Copy, Check, Eye } from 'lucide-solid';
import { shareStorage, noteStorage, formatDateTime } from '../utils/storage/localStorage';
import { getCourseById } from '../stores/courseStore';
import { renderAllMath } from '../utils/editor/katex';
import { highlightAllCodeBlocks } from '../utils/editor/codeHighlight';

const ShareView: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  const share = createMemo(() => shareStorage.getById(params.shareId));
  const note = createMemo(() => {
    if (!share()) return null;
    return noteStorage.getById(share()!.noteId);
  });
  
  const course = createMemo(() => {
    if (!note()) return null;
    return getCourseById(note()!.courseId);
  });
  
  const renderedContent = createMemo(() => {
    if (!note()) return '';
    let content = note()!.content;
    content = renderAllMath(content);
    content = highlightAllCodeBlocks(content);
    return content;
  });
  
  const handleMakeCopy = () => {
    if (!note() || !share()) return;
    
    const original = note()!;
    const newNote = {
      ...original,
      id: `note-${Date.now()}`,
      title: original.title + ' (副本)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSynced: false,
      version: `v-${Date.now()}`,
      comments: [],
    };
    
    noteStorage.save(newNote);
    navigate(`/course/${newNote.courseId}/notes/${newNote.id}`);
  };
  
  if (!share() || !note()) {
    return (
      <div class="flex-1 flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Eye size={32} class="text-gray-400" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">链接无效或已过期</h2>
          <p class="text-gray-500 mb-6">分享链接可能已被删除或过期</p>
          <button
            class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div class="flex-1 flex flex-col bg-white">
      <div class="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-white">
        <button
          class="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full"
            style={{ 'background-color': course()?.color || '#6b7280' }}
          />
          <span class="text-sm text-gray-600">{course()?.name || '未知课程'}</span>
        </div>
        
        <div class="flex-1" />
        
        <div class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          <Eye size={14} />
          {share()?.type === 'readonly' ? '只读分享' : '可复制分享'}
        </div>
        
        {share()?.type === 'copy' && (
          <button
            class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            onClick={handleMakeCopy}
          >
            <Copy size={18} />
            复制为我的笔记
          </button>
        )}
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto px-8 py-10">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            {note()!.title}
          </h1>
          
          <div class="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
            <span>创建于 {formatDateTime(note()!.createdAt)}</span>
            <span>·</span>
            <span>更新于 {formatDateTime(note()!.updatedAt)}</span>
          </div>
          
          {note()!.tags.length > 0 && (
            <div class="flex flex-wrap gap-2 mb-8">
              {note()!.tags.map(tag => (
                <span
                  class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div
            class="prose max-w-none editor-content"
            innerHTML={renderedContent()}
          />
        </div>
      </div>
    </div>
  );
};

export default ShareView;
