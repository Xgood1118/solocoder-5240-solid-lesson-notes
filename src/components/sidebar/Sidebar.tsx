import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { BookOpen, Search, Settings, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-solid';
import { courseStore, getAllCourses } from '../../stores/courseStore';
import { uiStore, toggleSidebar, setShowSearch } from '../../stores/uiStore';

const Sidebar: Component = () => {
  const navigate = useNavigate();
  
  const collapsed = () => uiStore.state.sidebarCollapsed;
  const courses = () => getAllCourses();
  
  return (
    <aside
      class={`flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${
        collapsed() ? 'w-16' : 'w-64'
      }`}
    >
      <div class="flex items-center h-16 px-4 border-b border-gray-100">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0">
            课
          </div>
          {!collapsed() && (
            <div class="min-w-0 slide-in">
              <h1 class="font-bold text-gray-900 truncate">课堂笔记</h1>
              <p class="text-xs text-gray-500 truncate">高效学习助手</p>
            </div>
          )}
        </div>
      </div>
      
      <div class="p-2">
        <button
          class={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors ${
            collapsed() ? 'justify-center' : ''
          }`}
          onClick={() => navigate('/')}
        >
          <BookOpen size={20} />
          {!collapsed() && <span>全部课程</span>}
        </button>
        
        <button
          class={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors ${
            collapsed() ? 'justify-center' : ''
          }`}
          onClick={() => setShowSearch(true)}
        >
          <Search size={20} />
          {!collapsed() && <span>搜索笔记</span>}
        </button>
      </div>
      
      {!collapsed() && (
        <div class="px-4 py-2">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            我的课程
          </h2>
        </div>
      )}
      
      <div class="flex-1 overflow-y-auto px-2 space-y-1">
        {courses().map(course => (
          <button
            class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              collapsed() ? 'justify-center' : ''
            } hover:bg-gray-50 text-gray-700`}
            onClick={() => navigate(`/course/${course.id}`)}
            title={course.name}
          >
            <div
              class="w-3 h-3 rounded-full flex-shrink-0"
              style={{ 'background-color': course.color }}
            />
            {!collapsed() && (
              <span class="truncate text-sm">{course.name}</span>
            )}
          </button>
        ))}
      </div>
      
      <div class="p-2 border-t border-gray-100">
        <div class="flex items-center gap-3">
          <button
            class={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors ${
              collapsed() ? 'justify-center' : ''
            }`}
            onClick={() => navigate('/settings')}
          >
            <Settings size={20} />
            {!collapsed() && <span class="text-sm">设置</span>}
          </button>
          
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={toggleSidebar}
            title={collapsed() ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed() ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        {!collapsed() && (
          <div class="mt-2 p-3 bg-primary-50 rounded-xl">
            <div class="flex items-center gap-2">
              <GraduationCap size={18} class="text-primary-600" />
              <span class="text-sm font-medium text-primary-700">学生模式</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
