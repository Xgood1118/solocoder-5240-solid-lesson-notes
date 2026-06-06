import { createSignal, createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Search as SearchIcon, ArrowLeft, Filter, Tag, Calendar, FileText } from 'lucide-solid';
import { noteStorage, formatDateTime } from '../utils/storage/localStorage';
import { getAllCourses, getCourseColor } from '../stores/courseStore';
import TagBadge from '../components/common/TagBadge';
import type { Note } from '../types';

const Search: Component = () => {
  const navigate = useNavigate();
  
  const [query, setQuery] = createSignal('');
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [selectedCourse, setSelectedCourse] = createSignal<string>('');
  const [dateRange, setDateRange] = createSignal<{ start?: string; end?: string }>({});
  
  const allTags = createMemo(() => {
    const notes = noteStorage.getAll();
    const tagSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  });
  
  const courses = () => getAllCourses();
  
  const searchResults = createMemo(() => {
    let results: Note[] = [];
    
    if (query()) {
      results = noteStorage.search(query());
    } else {
      results = noteStorage.getAll().sort((a, b) => b.updatedAt - a.updatedAt);
    }
    
    if (selectedTags().length > 0) {
      results = results.filter(note =>
        selectedTags().some(tag => note.tags.includes(tag))
      );
    }
    
    if (selectedCourse()) {
      results = results.filter(note => note.courseId === selectedCourse());
    }
    
    if (dateRange().start) {
      const start = new Date(dateRange().start!).getTime();
      results = results.filter(note => note.createdAt >= start);
    }
    if (dateRange().end) {
      const end = new Date(dateRange().end!).getTime() + 86400000;
      results = results.filter(note => note.createdAt <= end);
    }
    
    return results;
  });
  
  const getCourseName = (courseId: string) => {
    return courses().find(c => c.id === courseId)?.name || courseId;
  };
  
  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-accent-200 text-accent-900 rounded px-0.5">$1</mark>');
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const handleNoteClick = (note: Note) => {
    navigate(`/course/${note.courseId}/notes/${note.id}`);
  };
  
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  return (
    <div class="flex-1 flex overflow-hidden">
      <div class="w-64 bg-gray-50 border-r border-gray-100 p-4 overflow-y-auto">
        <button
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>
        
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Filter size={16} />
          筛选条件
        </h3>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">课程</label>
            <select
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedCourse()}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">全部课程</option>
              {courses().map(course => (
                <option value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">
              <Tag size={14} class="inline mr-1" />
              标签
            </label>
            <div class="flex flex-wrap gap-2">
              {allTags().map(tag => (
                <button
                  onClick={() => toggleTag(tag)}
                  class={`tag-badge cursor-pointer transition-all ${
                    selectedTags().includes(tag)
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allTags().length === 0 && (
                <span class="text-xs text-gray-400">暂无标签</span>
              )}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">
              <Calendar size={14} class="inline mr-1" />
              日期范围
            </label>
            <div class="space-y-2">
              <input
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="开始日期"
                value={dateRange().start || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <input
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="结束日期"
                value={dateRange().end || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          
          {(selectedTags().length > 0 || selectedCourse() || dateRange().start || dateRange().end) && (
            <button
              class="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => {
                setSelectedTags([]);
                setSelectedCourse('');
                setDateRange({});
              }}
            >
              清除所有筛选
            </button>
          )}
        </div>
      </div>
      
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="p-4 border-b border-gray-100 bg-white">
          <div class="relative">
            <SearchIcon size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
              placeholder="搜索笔记标题、内容、标签、数学公式..."
              value={query()}
              onInput={(e) => setQuery(e.target.value)}
              autofocus
            />
          </div>
          
          <p class="text-sm text-gray-500 mt-3">
            找到 <span class="font-medium text-gray-900">{searchResults().length}</span> 条结果
            {query() && ` 与 "${query()}" 相关`}
          </p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
          {searchResults().length === 0 ? (
            <div class="text-center py-16 text-gray-400">
              <FileText size={56} class="mx-auto mb-4 opacity-50" />
              <p class="text-lg">没有找到匹配的笔记</p>
              <p class="text-sm mt-1">试试其他关键词或清除筛选条件</p>
            </div>
          ) : (
            <div class="space-y-3 max-w-3xl mx-auto">
              {searchResults().map(note => {
                const courseColor = getCourseColor(note.courseId);
                
                return (
                  <div
                    class="p-5 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-primary-200 hover:shadow-sm transition-all group"
                    onClick={() => handleNoteClick(note)}
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ 'background-color': courseColor }}
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-4">
                          <h3
                            class="text-lg font-semibold text-gray-900 truncate"
                            innerHTML={highlightText(note.title, query())}
                          />
                          {!note.isSynced && (
                            <span class="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 sync-pulse mt-2" title="未同步" />
                          )}
                        </div>
                        
                        <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>{getCourseName(note.courseId)}</span>
                          <span>·</span>
                          <span>{formatDateTime(note.updatedAt)}</span>
                        </div>
                        
                        {note.tags.length > 0 && (
                          <div class="flex flex-wrap gap-1.5 mt-3">
                            {note.tags.slice(0, 5).map(tag => (
                              <TagBadge name={tag} color="#6b7280" size="sm" />
                            ))}
                            {note.tags.length > 5 && (
                              <span class="text-xs text-gray-400">+{note.tags.length - 5}</span>
                            )}
                          </div>
                        )}
                        
                        <p
                          class="text-gray-600 mt-3 line-clamp-3 leading-relaxed"
                          innerHTML={highlightText(
                            stripHtml(note.content).substring(0, 200) + (stripHtml(note.content).length > 200 ? '...' : ''),
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

export default Search;
