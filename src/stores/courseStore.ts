import { createStore } from 'solid-js/store';
import { courseStorage } from '../utils/storage/localStorage';
import type { Course } from '../types';

interface CourseState {
  courses: Course[];
  currentCourseId: string | null;
  loading: boolean;
}

const [state, setState] = createStore<CourseState>({
  courses: [],
  currentCourseId: null,
  loading: false,
});

export function loadCourses(): void {
  setState('loading', true);
  const courses = courseStorage.getAll();
  setState('courses', courses);
  setState('loading', false);
}

export function getAllCourses(): Course[] {
  return state.courses;
}

export function getCourseById(id: string): Course | undefined {
  return state.courses.find(c => c.id === id);
}

export function getCurrentCourse(): Course | null {
  return courseStorage.getCurrentCourse();
}

export function getTodayCourses(): Course[] {
  return courseStorage.getTodayCourses();
}

export function setCurrentCourse(id: string | null): void {
  setState('currentCourseId', id);
}

export function getCoursesByDay(dayOfWeek: number): Course[] {
  return state.courses
    .filter(course => course.schedule.some(s => s.dayOfWeek === dayOfWeek))
    .sort((a, b) => {
      const aTime = Math.min(...a.schedule.filter(s => s.dayOfWeek === dayOfWeek).map(s => {
        const [h, m] = s.startTime.split(':').map(Number);
        return h * 60 + m;
      }));
      const bTime = Math.min(...b.schedule.filter(s => s.dayOfWeek === dayOfWeek).map(s => {
        const [h, m] = s.startTime.split(':').map(Number);
        return h * 60 + m;
      }));
      return aTime - bTime;
    });
}

export function getCourseColor(courseId: string): string {
  const course = state.courses.find(c => c.id === courseId);
  return course?.color || '#6b7280';
}

export const courseStore = {
  state,
  loadCourses,
  getAllCourses,
  getCourseById,
  getCurrentCourse,
  getTodayCourses,
  setCurrentCourse,
  getCoursesByDay,
  getCourseColor,
};

export default courseStore;
