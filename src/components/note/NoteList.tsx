import { createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { Plus, FileText, BookMarked, Clock, ChevronRight } from 'lucide-solid';
import { noteStore, getNotesByCourseAndType, createNote } from '../../stores/noteStore';
import { courseStore, getCourseById } from '../../stores/courseStore';
import { uiStore, setActiveNoteType } from '../../stores/uiStore';
import { formatDateTime } from '../../utils/storage/localStorage';
import TagBadge from '../common/TagBadge';
import type { NoteType } from '../../types';

const NoteList: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  const courseId = () => params.courseId;
  const course = () => (courseId() ? getCourseById(courseId()!) : undefined);
  const activeType = () => uiStore.state.activeNoteType;
  
  const notes = createMemo(() => {
    if (!courseId()) return [];
    return getNotesByCourseAndType(courseId()!, activeType());
  });
  
  const handleCreateNote = () => {
    if (!courseId()) return;
    const note = createNote(courseId()!, activeType());
    navigate(`/course/${courseId()}/notes/${note.id}`);
  };
  
  const switchType = (type: NoteType) => {
    setActiveNoteType(type);
  };
  
  const typeLabel = (type: NoteType) => {
    return type === 'classroom' ? '课堂实录' : '课前预习';
  };
  
  const typeIcon = (type: NoteType) => {
    return type === 'classroom' ? <BookMarked size={16} /> : <FileText size={16} />;
  };
  
  return (
    <div class="w-72 bg-gray-50 border-r border-gray-100 flex flex-col">
      <div class="p-4 border-b border-gray-100 bg-white">
        <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          {course() && (
            <span
              class="w-3 h-3 rounded-full"
              style={{ 'background-color': course()?.color }}
            />
          )}
          {course()?.name || '笔记'}
        </h2>
        
        <div class="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            class={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeType() === 'classroom'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => switchType('classroom')}
          >
            {typeIcon('classroom')}
            课堂实录
          </button>
          <button
            class={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeType() === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => switchType('preview')}
          >
            {typeIcon('preview')}
            课前预习
          </button>
        </div>
      </div>
      
      <div class="p-3">
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          onClick={handleCreateNote}
        >
          <Plus size={18} />
          新建{typeLabel(activeType())}
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {notes().length === 0 ? (
          <div class="text-center py-8 text-gray-400">
            <FileText size={40} class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无{typeLabel(activeType())}笔记</p>
            <p class="text-xs mt-1">点击上方按钮创建</p>
          </div>
        ) : (
          notes().map(note => (
            <div
              class="p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-primary-200 hover:shadow-sm transition-all group"
              onClick={() => navigate(`/course/${courseId()}/notes/${note.id}`)}
            >
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-medium text-gray-900 text-sm truncate flex-1">
                  {note.title}
                </h3>
                {!note.isSynced && (
                  <span class="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 sync-pulse" title="未同步" />
                )}
              </div>
              
              <div class="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                <Clock size={12} />
                <span>{formatDateTime(note.updatedAt)}</span>
              </div>
              
              {note.tags.length > 0 && (
                <div class="flex flex-wrap gap-1 mt-2">
                  {note.tags.slice(0, 3).map(tag => (
                    <TagBadge name={tag} color="#6b7280" size="sm" />
                  ))}
                  {note.tags.length > 3 && (
                    <span class="text-xs text-gray-400">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
              
              <div class="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="flex items-center text-xs text-primary-600 font-medium">
                  查看详情
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoteList;
