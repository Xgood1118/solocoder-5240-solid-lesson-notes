import type { Component } from 'solid-js';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: Component<ModalProps> = (props) => {
  if (!props.isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };
  
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="absolute inset-0 bg-black/50"
        onClick={props.onClose}
      />
      <div class={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[props.size || 'md']} fade-in max-h-[90vh] flex flex-col`}>
        {props.title && (
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">{props.title}</h3>
            <button
              class="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>
        )}
        <div class="px-6 py-4 overflow-y-auto flex-1">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
