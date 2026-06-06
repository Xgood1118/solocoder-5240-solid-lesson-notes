import { createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Check, Clock } from 'lucide-solid';
import { isOnline, syncStatus, pendingCount, retryFailedSyncs } from '../../utils/sync/syncService';

interface SyncStatusProps {
  showDetail?: boolean;
}

const SyncStatus: Component<SyncStatusProps> = (props) => {
  const statusText = createMemo(() => {
    if (!isOnline()) return '离线模式';
    switch (syncStatus()) {
      case 'syncing': return '同步中...';
      case 'conflict': return '有冲突待解决';
      case 'error': return '同步失败';
      default:
        return pendingCount() > 0 ? `${pendingCount()} 项待同步` : '已同步';
    }
  });
  
  const statusColor = createMemo(() => {
    if (!isOnline()) return 'text-gray-500';
    switch (syncStatus()) {
      case 'syncing': return 'text-blue-500';
      case 'conflict': return 'text-amber-500';
      case 'error': return 'text-red-500';
      default:
        return pendingCount() > 0 ? 'text-amber-500' : 'text-green-500';
    }
  });
  
  const statusIcon = createMemo(() => {
    if (!isOnline()) return <WifiOff size={16} />;
    switch (syncStatus()) {
      case 'syncing': return <RefreshCw size={16} class="animate-spin" />;
      case 'conflict': return <AlertTriangle size={16} />;
      case 'error': return <AlertTriangle size={16} />;
      default:
        return pendingCount() > 0 ? <Clock size={16} /> : <Check size={16} />;
    }
  });
  
  if (props.showDetail) {
    return (
      <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
        <div class={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm ${statusColor()}`}>
          {statusIcon()}
        </div>
        <div class="flex-1">
          <p class="font-medium text-gray-900">{statusText()}</p>
          <p class="text-xs text-gray-500">
            {isOnline() ? '已连接网络' : '内容将在联网后自动同步'}
          </p>
        </div>
        {!isOnline() || syncStatus() === 'error' ? (
          <button
            class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            onClick={retryFailedSyncs}
          >
            立即同步
          </button>
        ) : null}
      </div>
    );
  }
  
  return (
    <div class={`flex items-center gap-1.5 text-xs ${statusColor()}`}>
      {statusIcon()}
      <span>{statusText()}</span>
    </div>
  );
};

export default SyncStatus;
