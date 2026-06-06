import { createStore } from 'solid-js/store';
import { tagStorage } from '../utils/storage/localStorage';
import type { Tag } from '../types';

interface TagState {
  tags: Tag[];
  selectedTags: string[];
}

const [state, setState] = createStore<TagState>({
  tags: [],
  selectedTags: [],
});

export function loadTags(): void {
  const tags = tagStorage.getAll();
  setState('tags', tags);
}

export function getAllTags(): Tag[] {
  return state.tags;
}

export function getTagById(id: string): Tag | undefined {
  return state.tags.find(t => t.id === id);
}

export function addTag(name: string, color: string = '#3b82f6'): Tag {
  const newTag: Tag = {
    id: `tag-${Date.now()}`,
    name,
    color,
  };
  tagStorage.save(newTag);
  setState('tags', [...state.tags, newTag]);
  return newTag;
}

export function deleteTag(id: string): void {
  tagStorage.delete(id);
  setState('tags', state.tags.filter(t => t.id !== id));
}

export function toggleTagSelection(tagName: string): void {
  if (state.selectedTags.includes(tagName)) {
    setState('selectedTags', state.selectedTags.filter(t => t !== tagName));
  } else {
    setState('selectedTags', [...state.selectedTags, tagName]);
  }
}

export function clearTagSelection(): void {
  setState('selectedTags', []);
}

export const tagStore = {
  state,
  loadTags,
  getAllTags,
  getTagById,
  addTag,
  deleteTag,
  toggleTagSelection,
  clearTagSelection,
};

export default tagStore;
