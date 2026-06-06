import { createSignal, createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { Share2, Copy, Link, Edit3, Eye, Clock, Check, Trash2 } from 'lucide-solid';
import { shareStorage, generateId, formatDateTime } from '../../utils/storage/localStorage';
import { getCurrentNote } from '../../stores/noteStore';
import type { ShareLink } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: Component<ShareModalProps> = (props) => {
  const [shareType, setShareType] = createSignal<'readonly' | 'copy'>('readonly');
  const [copied, setCopied] = createSignal(false);
  
  const note = createMemo(() => getCurrentNote());
  
  const myShares = createMemo(() => {
    return shareStorage.getAll().filter(s => s.noteId === note()?.id);
  });
  
  const generateShareLink = (type: 'readonly' | 'copy'): ShareLink => {
    const note = getCurrentNote();
    if (!note) {
      throw new Error('No note selected');
    }
    
    const link: ShareLink = {
      id: generateId(),
      noteId: note.id,
      type,
      createdAt: Date.now(),
    };
    
    shareStorage.save(link);
    return link;
  };
  
  const shareUrl = (link: ShareLink) => {
    return `${window.location.origin}/share/${link.id}`;
  };
  
  const copyLink = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(shareUrl(link));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const deleteShare = (id: string) => {
    shareStorage.delete(id);
  };
  
  const handleCreateShare = () => {
    generateShareLink(shareType());
  };
  
  if (!props.isOpen) return null;
  
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg fade-in max-h-[80vh] flex flex-col">
        <div class="p-5 border-b border-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Share2 class="text-primary-600" size={20} />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">分享笔记</h3>
            <p class="text-sm text-gray-500">{note()?.title}</p>
          </div>
          <button
            class="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={props.onClose}
          >
            ✕
          </button>
        </div>
        
        <div class="p-5 overflow-y-auto flex-1">
          <div class="mb-6">
            <p class="text-sm font-medium text-gray-700 mb-3">选择分享方式</p>
            <div class="grid grid-cols-2 gap-3">
              <button
                class={`p-4 rounded-xl border-2 text-left transition-all ${
                  shareType() === 'readonly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setShareType('readonly')}
              >
                <div class="flex items-center gap-2 mb-2">
                  <Eye size={20} class={shareType() === 'readonly' ? 'text-primary-600' : 'text-gray-400'} />
                  <span class={`font-medium ${shareType() === 'readonly' ? 'text-primary-700' : 'text-gray-700'}`}>
                    只读链接
                  </span>
                </div>
                <p class="text-xs text-gray-500">对方可以查看，但不能修改</p>
              </button>
              
              <button
                class={`p-4 rounded-xl border-2 text-left transition-all ${
                  shareType() === 'copy'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setShareType('copy')}
              >
                <div class="flex items-center gap-2 mb-2">
                  <Edit3 size={20} class={shareType() === 'copy' ? 'text-primary-600' : 'text-gray-400'} />
                  <span class={`font-medium ${shareType() === 'copy' ? 'text-primary-700' : 'text-gray-700'}`}>
                    可编辑副本
                  </span>
                </div>
                <p class="text-xs text-gray-500">对方获得自己的副本可编辑</p>
              </button>
            </div>
          </div>
          
          <button
            class="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            onClick={handleCreateShare}
          >
            <Link size={18} />
            生成分享链接
          </button>
          
          {myShares().length > 0 && (
            <div class="mt-6">
              <p class="text-sm font-medium text-gray-700 mb-3">已生成的链接</p>
              <div class="space-y-2">
                {myShares().map(share => (
                  <div
                    class="p-3 bg-gray-50 rounded-xl flex items-center gap-3"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-700">
                          {share.type === 'readonly' ? '只读' : '副本'}
                        </span>
                        <span class="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {formatDateTime(share.createdAt)}
                        </span>
                      </div>
                      <p class="text-xs text-gray-400 truncate mt-1">
                        {shareUrl(share)}
                      </p>
                    </div>
                    
                    <button
                      class="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      onClick={() => copyLink(share)}
                      title="复制链接"
                    >
                      {copied() ? <Check size={16} class="text-green-500" /> : <Copy size={16} />}
                    </button>
                    
                    <button
                      class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => deleteShare(share.id)}
                      title="删除链接"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
