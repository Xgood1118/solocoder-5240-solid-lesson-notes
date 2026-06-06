import { createSignal, createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { MessageSquare, ChevronDown, ChevronUp, Send, User, GraduationCap } from 'lucide-solid';
import { addComment, getCurrentNote } from '../../stores/noteStore';
import { formatDateTime } from '../../utils/storage/localStorage';
import type { Comment } from '../../types';

interface CommentsPanelProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommentsPanel: Component<CommentsPanelProps> = (props) => {
  const [newComment, setNewComment] = createSignal('');
  const [expandedIds, setExpandedIds] = createSignal<string[]>([]);
  
  const note = createMemo(() => getCurrentNote());
  const comments = () => note()?.comments || [];
  
  const toggleExpand = (id: string) => {
    setExpandedIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
    );
  };
  
  const isExpanded = (id: string) => expandedIds().includes(id);
  
  const handleAddComment = () => {
    if (!newComment().trim() || !props.noteId) return;
    
    addComment(props.noteId, newComment().trim(), '我', 'student');
    setNewComment('');
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };
  
  const unresolvedCount = () => comments().filter(c => !c.isResolved).length;
  
  if (!props.isOpen) return null;
  
  return (
    <div class="w-80 border-l border-gray-100 bg-white flex flex-col">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <MessageSquare size={18} class="text-primary-600" />
          <h3 class="font-semibold text-gray-900">批注</h3>
          {unresolvedCount() > 0 && (
            <span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
              {unresolvedCount()}
            </span>
          )}
        </div>
        <button
          class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={props.onClose}
        >
          ✕
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {comments().length === 0 ? (
          <div class="text-center py-8 text-gray-400">
            <MessageSquare size={32} class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无批注</p>
            <p class="text-xs mt-1">老师的批注会显示在这里</p>
          </div>
        ) : (
          comments().map(comment => (
            <CommentItem
              comment={comment}
              isExpanded={isExpanded(comment.id)}
              onToggle={() => toggleExpand(comment.id)}
            />
          ))
        )}
      </div>
      
      <div class="p-3 border-t border-gray-100">
        <div class="flex gap-2">
          <input
            type="text"
            class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="添加批注..."
            value={newComment()}
            onInput={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            class="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            onClick={handleAddComment}
            disabled={!newComment().trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  isExpanded: boolean;
  onToggle: () => void;
}

const CommentItem: Component<CommentItemProps> = (props) => {
  const isTeacher = props.comment.authorRole === 'teacher';
  
  return (
    <div
      class={`rounded-xl border transition-all overflow-hidden ${
        props.comment.isResolved
          ? 'bg-gray-50 border-gray-100'
          : isTeacher
          ? 'bg-accent-50 border-accent-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div
        class="p-3 cursor-pointer"
        onClick={props.onToggle}
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div
              class={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                isTeacher ? 'bg-accent-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isTeacher ? <GraduationCap size={14} /> : <User size={14} />}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 truncate">
                  {props.comment.author}
                </span>
                {isTeacher && (
                  <span class="px-1.5 py-0.5 bg-accent-200 text-accent-800 text-xs rounded font-medium flex-shrink-0">
                    老师
                  </span>
                )}
              </div>
              <p class="text-xs text-gray-500">
                {formatDateTime(props.comment.createdAt)}
              </p>
            </div>
          </div>
          
          <button class="text-gray-400 hover:text-gray-600 transition-colors">
            {props.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {!props.isExpanded && (
          <p class="text-sm text-gray-600 mt-2 line-clamp-2">
            {props.comment.content}
          </p>
        )}
      </div>
      
      {props.isExpanded && (
        <div class="px-3 pb-3 pt-0">
          <p class="text-sm text-gray-700 leading-relaxed">
            {props.comment.content}
          </p>
          
          {props.comment.targetText && (
            <div class="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded-r text-sm text-gray-600">
              <p class="text-xs text-yellow-700 mb-1">引用原文：</p>
              <p class="line-clamp-2">{props.comment.targetText}</p>
            </div>
          )}
          
          <div class="flex items-center gap-2 mt-3">
            {props.comment.isResolved ? (
              <span class="text-xs text-green-600 font-medium">✓ 已解决</span>
            ) : (
              <span class="text-xs text-accent-600 font-medium">待回复</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsPanel;
