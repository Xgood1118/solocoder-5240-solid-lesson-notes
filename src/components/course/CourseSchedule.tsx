import { createSignal, createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-solid';
import { getAllCourses, getCurrentCourse, getTodayCourses } from '../../stores/courseStore';
import { getDayName } from '../../utils/storage/localStorage';

const CourseSchedule: Component = () => {
  const navigate = useNavigate();
  
  const [selectedWeekOffset, setSelectedWeekOffset] = createSignal(0);
  
  const currentCourse = createMemo(() => getCurrentCourse());
  const todayCourses = createMemo(() => getTodayCourses());
  const allCourses = createMemo(() => getAllCourses());
  
  const weekDays = createMemo(() => {
    const days = [];
    const today = new Date();
    today.setDate(today.getDate() + selectedWeekOffset() * 7);
    
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        date,
        dayOfWeek: date.getDay(),
        dayName: getDayName(date.getDay()),
        isToday: isSameDay(date, new Date()),
      });
    }
    return days;
  });
  
  function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }
  
  const getCoursesForDay = (dayOfWeek: number) => {
    return allCourses()
      .filter(course => course.schedule.some(s => s.dayOfWeek === dayOfWeek))
      .map(course => {
        const schedule = course.schedule
          .filter(s => s.dayOfWeek === dayOfWeek)
          .sort((a, b) => a.period - b.period);
        return { ...course, daySchedule: schedule };
      })
      .sort((a, b) => a.daySchedule[0].period - b.daySchedule[0].period);
  };
  
  const isCurrentPeriod = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };
  
  const prevWeek = () => setSelectedWeekOffset(prev => prev - 1);
  const nextWeek = () => setSelectedWeekOffset(prev => prev + 1);
  
  return (
    <div class="w-full max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">本周课程表</h2>
        <div class="flex items-center gap-2">
          <button
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            onClick={prevWeek}
          >
            <ChevronLeft size={20} />
          </button>
          <span class="text-sm text-gray-600 font-medium min-w-24 text-center">
            {selectedWeekOffset() === 0 ? '本周' : `${selectedWeekOffset()}周后`}
          </span>
          <button
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            onClick={nextWeek}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      {currentCourse() && (
        <div class="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border border-primary-100 fade-in">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Sparkles class="text-primary-600" size={24} />
            </div>
            <div class="flex-1">
              <p class="text-sm text-primary-600 font-medium">正在上课</p>
              <h3 class="text-lg font-bold text-gray-900">{currentCourse()?.name}</h3>
            </div>
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              onClick={() => navigate(`/course/${currentCourse()?.id}`)}
            >
              进入笔记
            </button>
          </div>
        </div>
      )}
      
      {todayCourses().length === 0 && (
        <div class="mb-6 p-6 bg-gray-50 rounded-2xl text-center">
          <Clock class="mx-auto text-gray-300 mb-2" size={32} />
          <p class="text-gray-500">今日无排课</p>
          <p class="text-sm text-gray-400 mt-1">好好休息一下吧～</p>
        </div>
      )}
      
      <div class="grid grid-cols-5 gap-3">
        {weekDays().map(day => (
          <div
            class={`rounded-xl overflow-hidden ${
              day.isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''
            }`}
          >
            <div
              class={`p-3 text-center ${
                day.isToday ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600'
              }`}
            >
              <p class="text-sm font-medium">{day.dayName}</p>
              <p class={`text-lg font-bold ${day.isToday ? '' : 'text-gray-900'}`}>
                {day.date.getDate()}
              </p>
            </div>
            
            <div class="bg-white border border-gray-100 border-t-0 rounded-b-xl p-2 space-y-2 min-h-48">
              {getCoursesForDay(day.dayOfWeek).map(course => (
                course.daySchedule.map(schedule => {
                  const isCurrent = day.isToday && isCurrentPeriod(schedule.startTime, schedule.endTime);
                  return (
                    <button
                      class={`w-full p-2 rounded-lg text-left transition-all ${
                        isCurrent
                          ? 'bg-primary-100 border-2 border-primary-400'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <div
                        class={`w-2 h-2 rounded-full mb-1 ${
                          isCurrent ? '' : ''
                        }`}
                        style={{ 'background-color': course.color }}
                      />
                      <p class={`text-sm font-medium ${
                        isCurrent ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {course.name}
                      </p>
                      <p class={`text-xs ${
                        isCurrent ? 'text-primary-700' : 'text-gray-400'
                      }`}>
                        第{schedule.period}节 · {schedule.startTime}
                      </p>
                    </button>
                  );
                })
              ))}
              
              {getCoursesForDay(day.dayOfWeek).length === 0 && (
                <div class="text-center py-8 text-gray-300 text-sm">
                  无课程
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseSchedule;
