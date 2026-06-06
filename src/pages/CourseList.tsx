import type { Component } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { ArrowLeft, Plus, BookMarked, FileText } from 'lucide-solid';
import NoteList from '../components/note/NoteList';
import { getCourseById } from '../stores/courseStore';
import { getNotesByCourseAndType, createNote } from '../stores/noteStore';
import { formatDateTime } from '../utils/storage/localStorage';
import TagBadge from '../components/common/TagBadge';

const CourseList: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  const courseId = () => params.courseId;
  const course = () => (courseId() ? getCourseById(courseId()!) : undefined);
  
  const classroomNotes = () => getNotesByCourseAndType(courseId()!, 'classroom');
  const previewNotes = () => getNotesByCourseAndType(courseId()!, 'preview');
  
  const handleCreateNote = (type: 'classroom' | 'preview') => {
    if (!courseId()) return;
    const note = createNote(courseId()!, type);
    navigate(`/course/${courseId()}/notes/${note.id}`);
  };
  
  const NoteCard: Component<{ note: any; type: 'classroom' | 'preview' }> = (props) => (
    <div
      class="p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-primary-200 hover:shadow-sm transition-all group"
      onClick={() => navigate(`/course/${courseId()}/notes/${props.note.id}`)}
    >
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-medium text-gray-900 truncate flex-1">
          {props.note.title}
        </h3>
        {!props.note.isSynced && (
          <span class="w-2 h-2 rounded-full bg-amber-400 sync-pulse flex-shrink-0" title="未同步" />
        )}
      </div>
      
      <p class="text-xs text-gray-400 mt-1">
        {formatDateTime(props.note.updatedAt)}
      </p>
      
      {props.note.tags.length > 0 && (
        <div class="flex flex-wrap gap-1 mt-3">
          {props.note.tags.slice(0, 3).map((tag: string) => (
            <TagBadge name={tag} color="#6b7280" size="sm" />
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div class="flex-1 flex overflow-hidden">
      <NoteList />
      
      <div class="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div class="max-w-4xl mx-auto">
          <button
            class="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={18} />
            <span>返回课程表</span>
          </button>
          
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ 'background-color': course()?.color || '#6b7280' }}
            >
              {course()?.name?.charAt(0) || '课'}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{course()?.name}</h1>
              <p class="text-gray-500">{course()?.teacher} · 每周 {course()?.schedule.length} 节课</p>
            </div>
          </div>
          
          <div class="space-y-8">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <BookMarked size={20} class="text-primary-600" />
                  <h2 class="text-lg font-semibold text-gray-900">课堂实录</h2>
                  <span class="text-sm text-gray-400">({classroomNotes().length})</span>
                </div>
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
                  onClick={() => handleCreateNote('classroom')}
                >
                  <Plus size={16} />
                  新建
                </button>
              </div>
              
              {classroomNotes().length === 0 ? (
                <div class="p-8 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                  <BookMarked size={32} class="mx-auto text-gray-300 mb-2" />
                  <p class="text-gray-500">暂无课堂实录笔记</p>
                  <button
                    class="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    onClick={() => handleCreateNote('classroom')}
                  >
                    创建第一篇
                  </button>
                </div>
              ) : (
                <div class="grid grid-cols-2 gap-4">
                  {classroomNotes().slice(0, 6).map(note => (
                    <NoteCard note={note} type="classroom" />
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <FileText size={20} class="text-accent-600" />
                  <h2 class="text-lg font-semibold text-gray-900">课前预习</h2>
                  <span class="text-sm text-gray-400">({previewNotes().length})</span>
                </div>
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent-600 hover:bg-accent-50 rounded-lg font-medium transition-colors"
                  onClick={() => handleCreateNote('preview')}
                >
                  <Plus size={16} />
                  新建
                </button>
              </div>
              
              {previewNotes().length === 0 ? (
                <div class="p-8 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                  <FileText size={32} class="mx-auto text-gray-300 mb-2" />
                  <p class="text-gray-500">暂无课前预习笔记</p>
                  <button
                    class="mt-3 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
                    onClick={() => handleCreateNote('preview')}
                  >
                    创建第一篇
                  </button>
                </div>
              ) : (
                <div class="grid grid-cols-2 gap-4">
                  {previewNotes().slice(0, 6).map(note => (
                    <NoteCard note={note} type="preview" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
