import type { Component } from 'solid-js';

interface TagBadgeProps {
  name: string;
  color?: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const TagBadge: Component<TagBadgeProps> = (props) => {
  const sizeClasses = props.size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  
  return (
    <span
      class={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        'background-color': `${props.color || '#3b82f6'}20`,
        color: props.color || '#3b82f6',
      }}
    >
      {props.name}
      {props.onRemove && (
        <button
          class="hover:opacity-70 transition-opacity"
          onClick={props.onRemove}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default TagBadge;
