import type { Component } from 'solid-js';
import { Route, useLocation } from '@solidjs/router';
import { onMount } from 'solid-js';
import Sidebar from './components/sidebar/Sidebar';
import SearchModal from './components/search/SearchModal';
import Home from './pages/Home';
import CourseList from './pages/CourseList';
import NoteEditor from './pages/NoteEditor';
import Search from './pages/Search';
import ShareView from './pages/ShareView';
import Settings from './pages/Settings';
import { loadCourses } from './stores/courseStore';
import { loadNotes } from './stores/noteStore';
import { loadTags } from './stores/tagStore';
import { initSyncService } from './utils/sync/syncService';
import { uiStore, setShowSearch } from './stores/uiStore';

const App: Component = () => {
  const location = useLocation();
  
  onMount(() => {
    loadCourses();
    loadNotes();
    loadTags();
    initSyncService();
  });
  
  const isSharePage = () => location.pathname.startsWith('/share/');
  const showSidebar = () => !isSharePage();
  
  return (
    <div class="h-screen flex bg-gray-50 text-gray-900">
      {showSidebar() && <Sidebar />}
      
      <main class="flex-1 flex flex-col overflow-hidden">
        <Route path="/" component={Home} />
        <Route path="/course/:courseId" component={CourseList} />
        <Route path="/course/:courseId/notes/:noteId" component={NoteEditor} />
        <Route path="/search" component={Search} />
        <Route path="/share/:shareId" component={ShareView} />
        <Route path="/settings" component={Settings} />
      </main>
      
      <SearchModal
        isOpen={uiStore.state.showSearch}
        onClose={() => setShowSearch(false)}
      />
    </div>
  );
};

export default App;
