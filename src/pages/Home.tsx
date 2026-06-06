import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { BookOpen, Search, Plus, Sparkles, Clock, FileText } from 'lucide-solid';
import CourseSchedule from '../components/course/CourseSchedule';
import { getTodayCourses, getCurrentCourse } from '../stores/courseStore';
import { getNotesByCourse } from '../stores/noteStore';
import { formatDate } from '../utils/storage/localStorage';

const Home: Component = () => {
  const navigate = useNavigate();
  
  const currentCourse = () => getCurrentCourse();
  const todayCourses = () => getTodayCourses();
  
  const today = new Date();
  const dateStr = formatDate(today.getTime());
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = dayNames[today.getDay()];
  
  return (
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div class="max-w-5xl mx-auto p-6">
        <div class="mb-8">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">{dateStr} {dayName}</p>
              <h1 class="text-3xl font-bold text-gray-900">
                你好，同学 👋
              </h1>
              <p class="text-gray-500 mt-2">
                今天有 {todayCourses().length} 节课，加油！
              </p>
            </div>
            
            <div class="flex gap-3">
              <button
                class="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-gray-700"
                onClick={() => navigate('/search')}
              >
                <Search size={18} />
                <span>搜索笔记</span>
              </button>
              
              <button
                class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl shadow-sm hover:bg-primary-700 transition-colors"
                onClick={() => {
                  if (currentCourse()) {
                    navigate(`/course/${currentCourse()?.id}`);
                  }
                }}
              >
                <Plus size={18} />
                <span>快速记笔记</span>
              </button>
            </div>
          </div>
        </div>
        
        <CourseSchedule />
        
        <div class="mt-10">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">最近笔记</h2>
            <button
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => navigate('/search')}
            >
              查看全部 →
            </button>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            {todayCourses().slice(0, 3).map(course => {
              const notes = getNotesByCourse(course.id);
              return (
                <div
                  class="p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div class="flex items-center gap-3 mb-3">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ 'background-color': course.color }}
                    >
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">{course.name}</h3>
                      <p class="text-xs text-gray-400">{course.teacher}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span class="flex items-center gap-1">
                      <FileText size={14} />
                      {notes.length} 篇笔记
                    </span>
                  </div>
                  
                  <div class="mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-sm text-primary-600 font-medium">
                      查看课程笔记 →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div class="mt-10 p-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl text-white">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold mb-2">高效学习小贴士</h3>
              <p class="text-white/80 leading-relaxed">
                课前预习时用「课前预习」笔记记下疑问，课堂上用「课堂实录」实时记录重点，
                课后结合两边笔记复习效果更好哦！公式输入时使用 $...$ 行内公式，
                $$...$$ 块级公式，系统会自动渲染。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
