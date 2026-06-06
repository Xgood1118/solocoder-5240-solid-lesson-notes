import { createSignal, createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Search, X, Tag, Calendar, FileText, Filter } from 'lucide-solid';
import { noteStorage, formatDateTime } from '../../utils/storage/localStorage';
import { getAllCourses, getCourseColor } from '../../stores/courseStore';
import TagBadge from '../common/TagBadge';
import type { Note } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: Component<SearchModalProps> = (props) => {
  const navigate = useNavigate();
  
  const [query, setQuery] = createSignal('');
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [dateRange, setDateRange] = createSignal<{ start?: string; end?: string }>({});
  
  const allTags = createMemo(() => {
    const notes = noteStorage.getAll();
    const tagSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  });
  
  const searchResults = createMemo(() => {
    let results: Note[] = [];
    
    if (query()) {
      results = noteStorage.search(query());
    } else {
      results = noteStorage.getAll();
    }
    
    if (selectedTags().length > 0) {
      results = results.filter(note =>
        selectedTags().some((tag: string) => note.tags.includes(tag))
      );
    }
    
    if (dateRange().start) {
      const start = new Date(dateRange().start!).getTime();
      results = results.filter(note => note.createdAt >= start);
    }
    if (dateRange().end) {
      const end = new Date(dateRange().end!).getTime() + 86400000;
      results = results.filter(note => note.createdAt <= end);
    }
    
    return results.slice(0, 50);
  });
  
  const courses = () => getAllCourses();
  
  const getCourseName = (courseId: string) => {
    return courses().find(c => c.id === courseId)?.name || courseId;
  };
  
  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark class="bg-accent-200 text-accent-900 rounded px-0.5">$1</mark>');
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags((prev: string[]) =>
      prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag]
    );
  };
  
  const handleNoteClick = (note: Note) => {
    props.onClose();
    navigate(`/course/${note.courseId}/notes/${note.id}`);
  };
  
  if (!props.isOpen) return null;
  
  return (
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div class="absolute inset-0 bg-black/30" onClick={props.onClose} />
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[70vh] flex flex-col fade-in overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <Search size={20} class="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              class="flex-1 text-lg outline-none"
              placeholder="搜索笔记内容、标签、公式..."
              value={query()}
              onInput={(e) => setQuery(e.target.value)}
              autofocus
            />
            <button
              class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={props.onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <Filter size={16} class="text-gray-500" />
            <span class="text-sm text-gray-600 font-medium">筛选:</span>
          </div>
          
          {allTags().length > 0 && (
            <div class="flex items-center gap-1.5 flex-wrap">
              {allTags().slice(0, 8).map(tag => (
                <button
                  class={`tag-badge cursor-pointer transition-all ${
                    selectedTags().includes(tag)
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          
          <div class="flex items-center gap-2 ml-auto">
            <Calendar size={16} class="text-gray-500" />
            <input
              type="date"
              class="text-sm border border-gray-200 rounded px-2 py-1 text-gray-600"
              placeholder="开始日期"
              value={dateRange().start || ''}
              onChange={(e) => setDateRange((prev: { start?: string; end?: string }) => ({ ...prev, start: e.target.value }))}
            />
            <span class="text-gray-400">至</span>
            <input
              type="date"
              class="text-sm border border-gray-200 rounded px-2 py-1 text-gray-600"
              placeholder="结束日期"
              value={dateRange().end || ''}
              onChange={(e) => setDateRange((prev: { start?: string; end?: string }) => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          {searchResults().length === 0 ? (
            <div class="text-center py-12 text-gray-400">
              <FileText size={48} class="mx-auto mb-3 opacity-50" />
              <p>{query() || selectedTags().length > 0 ? '没有找到匹配的笔记' : '输入关键词开始搜索'}</p>
            </div>
          ) : (
            <div class="divide-y divide-gray-50">
              {searchResults().map(note => {
                const courseColor = getCourseColor(note.courseId);
                
                return (
                  <div
                    class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleNoteClick(note)}
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ 'background-color': courseColor }}
                      />
                      <div class="flex-1 min-w-0">
                        <h4
                          class="font-medium text-gray-900 truncate"
                          innerHTML={highlightText(note.title, query())}
                        />
                        <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{getCourseName(note.courseId)}</span>
                          <span>·</span>
                          <span>{formatDateTime(note.updatedAt)}</span>
                        </div>
                        
                        {note.tags.length > 0 && (
                          <div class="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <TagBadge name={tag} color="#6b7280" size="sm" />
                            ))}
                          </div>
                        )}
                        
                        <p
                          class="text-sm text-gray-500 mt-2 line-clamp-2"
                          innerHTML={highlightText(
                            stripHtml(note.content).substring(0, 200),
                            query()
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export default SearchModal;
