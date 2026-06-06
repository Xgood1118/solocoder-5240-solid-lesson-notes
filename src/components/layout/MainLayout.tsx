import type { Component } from 'solid-js';
import type { RouteSectionProps } from '@solidjs/router';
import { useLocation } from '@solidjs/router';
import { onMount } from 'solid-js';
import Sidebar from '../sidebar/Sidebar';
import SearchModal from '../search/SearchModal';
import { loadCourses } from '../../stores/courseStore';
import { loadNotes } from '../../stores/noteStore';
import { loadTags } from '../../stores/tagStore';
import { initSyncService } from '../../utils/sync/syncService';
import { uiStore, setShowSearch } from '../../stores/uiStore';

const MainLayout: Component<RouteSectionProps> = (props) => {
  const location = useLocation();
  
  onMount(() => {
    loadCourses();
    loadNotes();
    loadTags();
    initSyncService();
  });
  
  const showSidebar = () => !location.pathname.startsWith('/share/');
  
  return (
    <div class="h-screen flex bg-gray-50 text-gray-900">
      {showSidebar() && <Sidebar />}
      
      <main class="flex-1 flex flex-col overflow-hidden">
        {props.children}
      </main>
      
      <SearchModal
        isOpen={uiStore.state.showSearch}
        onClose={() => setShowSearch(false)}
      />
    </div>
  );
};

export default MainLayout;
