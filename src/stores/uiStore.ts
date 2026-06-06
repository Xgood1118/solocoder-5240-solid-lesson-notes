import { createStore } from 'solid-js/store';

interface UIState {
  sidebarCollapsed: boolean;
  noteListCollapsed: boolean;
  darkMode: boolean;
  showSearch: boolean;
  showShareModal: boolean;
  showCanvas: boolean;
  showExportMenu: boolean;
  showImportModal: boolean;
  showConflictModal: boolean;
  activeNoteType: 'classroom' | 'preview';
}

const [state, setState] = createStore<UIState>({
  sidebarCollapsed: false,
  noteListCollapsed: false,
  darkMode: false,
  showSearch: false,
  showShareModal: false,
  showCanvas: false,
  showExportMenu: false,
  showImportModal: false,
  showConflictModal: false,
  activeNoteType: 'classroom',
});

export function toggleSidebar(): void {
  setState('sidebarCollapsed', !state.sidebarCollapsed);
}

export function toggleNoteList(): void {
  setState('noteListCollapsed', !state.noteListCollapsed);
}

export function toggleDarkMode(): void {
  setState('darkMode', !state.darkMode);
  document.documentElement.classList.toggle('dark', !state.darkMode);
}

export function setShowSearch(show: boolean): void {
  setState('showSearch', show);
}

export function setShowShareModal(show: boolean): void {
  setState('showShareModal', show);
}

export function setShowCanvas(show: boolean): void {
  setState('showCanvas', show);
}

export function setShowExportMenu(show: boolean): void {
  setState('showExportMenu', show);
}

export function setShowImportModal(show: boolean): void {
  setState('showImportModal', show);
}

export function setShowConflictModal(show: boolean): void {
  setState('showConflictModal', show);
}

export function setActiveNoteType(type: 'classroom' | 'preview'): void {
  setState('activeNoteType', type);
}

export const uiStore = {
  state,
  toggleSidebar,
  toggleNoteList,
  toggleDarkMode,
  setShowSearch,
  setShowShareModal,
  setShowCanvas,
  setShowExportMenu,
  setShowImportModal,
  setShowConflictModal,
  setActiveNoteType,
};

export default uiStore;
