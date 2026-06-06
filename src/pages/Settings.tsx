import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  ArrowLeft, Settings as SettingsIcon, User, Bell,
  Database, Download, Upload, Trash2, Info,
  Moon, Sun, Palette
} from 'lucide-solid';
import { isOnline, syncStatus, pendingCount, retryFailedSyncs } from '../utils/sync/syncService';
import { noteStorage, courseStorage } from '../utils/storage/localStorage';

const Settings: Component = () => {
  const navigate = useNavigate();
  
  const notesCount = () => noteStorage.getAll().length;
  const coursesCount = () => courseStorage.getAll().length;
  
  const handleExportAll = () => {
    const data = {
      notes: noteStorage.getAll(),
      courses: courseStorage.getAll(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImportAll = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.notes && Array.isArray(data.notes)) {
          if (confirm(`确定要导入 ${data.notes.length} 篇笔记吗？这将覆盖现有数据。`)) {
            localStorage.setItem('lesson_notes', JSON.stringify(data.notes));
            if (data.courses) {
              localStorage.setItem('lesson_courses', JSON.stringify(data.courses));
            }
            alert('导入成功！');
            window.location.reload();
          }
        }
      } catch (err) {
        alert('导入失败：文件格式错误');
      }
    };
    
    input.click();
  };
  
  const handleClearAll = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      localStorage.clear();
      indexedDB.deleteDatabase('lesson-notes-db');
      alert('数据已清除，页面即将刷新');
      window.location.reload();
    }
  };
  
  const SectionTitle: Component<{ children: any }> = (props) => (
    <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
      {props.children}
    </h3>
  );
  
  const SettingItem: Component<{ icon: any; title: string; desc?: string; action: any }> = (props) => (
    <div class="flex items-center justify-between py-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          {props.icon}
        </div>
        <div>
          <p class="font-medium text-gray-900">{props.title}</p>
          {props.desc && <p class="text-sm text-gray-500">{props.desc}</p>}
        </div>
      </div>
      <div>{props.action}</div>
    </div>
  );
  
  return (
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div class="max-w-2xl mx-auto p-6">
        <div class="flex items-center gap-3 mb-8">
          <button
            class="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 class="text-2xl font-bold text-gray-900">设置</h1>
        </div>
        
        <div class="space-y-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <SectionTitle>账户</SectionTitle>
            
            <div class="flex items-center gap-4 pb-4 border-b border-gray-50">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold">
                学
              </div>
              <div>
                <p class="font-semibold text-gray-900">学生用户</p>
                <p class="text-sm text-gray-500">本地模式 · 数据存储在浏览器</p>
              </div>
            </div>
            
            <div class="pt-2">
              <SettingItem
                icon={<User size={18} />}
                title="用户信息"
                desc="查看和编辑个人资料"
                action={<span class="text-gray-400">→</span>}
              />
            </div>
          </div>
          
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <SectionTitle>同步</SectionTitle>
            
            <div class={`p-4 rounded-xl mb-4 ${
              isOnline() ? 'bg-green-50' : 'bg-gray-100'
            }`}>
              <div class="flex items-center gap-3">
                <div class={`w-2 h-2 rounded-full ${
                  isOnline() ? 'bg-green-500' : 'bg-gray-400'
                } ${isOnline() && syncStatus() === 'syncing' ? 'sync-pulse' : ''}`} />
                <div class="flex-1">
                  <p class="font-medium text-gray-900">
                    {isOnline() ? '已连接' : '离线模式'}
                  </p>
                  <p class="text-sm text-gray-500">
                    {isOnline()
                      ? pendingCount() > 0 ? `${pendingCount()} 项待同步` : '数据已同步'
                      : '联网后自动同步'
                    }
                  </p>
                </div>
                {!isOnline() && (
                  <button
                    class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    onClick={retryFailedSyncs}
                  >
                    立即同步
                  </button>
                )}
              </div>
            </div>
            
            <SettingItem
              icon={<Bell size={18} />}
              title="同步通知"
              desc="同步完成时提醒"
              action={
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" checked />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              }
            />
          </div>
          
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <SectionTitle>外观</SectionTitle>
            
            <SettingItem
              icon={<Palette size={18} />}
              title="主题"
              desc="浅色 / 深色 / 跟随系统"
              action={
                <div class="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <button class="px-3 py-1 rounded-md text-sm bg-white shadow-sm text-gray-900 font-medium">
                    浅色
                  </button>
                  <button class="px-3 py-1 rounded-md text-sm text-gray-500 hover:text-gray-700">
                    深色
                  </button>
                </div>
              }
            />
            
            <SettingItem
              icon={<Moon size={18} />}
              title="夜间模式"
              desc="减少眼睛疲劳"
              action={
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              }
            />
          </div>
          
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <SectionTitle>数据管理</SectionTitle>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl text-center">
                <p class="text-2xl font-bold text-gray-900">{notesCount()}</p>
                <p class="text-sm text-gray-500">篇笔记</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl text-center">
                <p class="text-2xl font-bold text-gray-900">{coursesCount()}</p>
                <p class="text-sm text-gray-500">门课程</p>
              </div>
            </div>
            
            <SettingItem
              icon={<Download size={18} />}
              title="导出全部数据"
              desc="备份所有笔记和设置"
              action={
                <button
                  class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  onClick={handleExportAll}
                >
                  导出
                </button>
              }
            />
            
            <SettingItem
              icon={<Upload size={18} />}
              title="导入数据"
              desc="从备份文件恢复"
              action={
                <button
                  class="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={handleImportAll}
                >
                  导入
                </button>
              }
            />
            
            <SettingItem
              icon={<Trash2 size={18} />}
              title="清除所有数据"
              desc="删除所有笔记和设置"
              action={
                <button
                  class="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  onClick={handleClearAll}
                >
                  清除
                </button>
              }
            />
          </div>
          
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <SectionTitle>关于</SectionTitle>
            
            <SettingItem
              icon={<Info size={18} />}
              title="版本"
              action={<span class="text-sm text-gray-500">v1.0.0</span>}
            />
            
            <p class="text-xs text-gray-400 mt-4">
              课堂笔记 · 高效学习助手<br />
              数据完全存储在本地浏览器中，保护您的隐私
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
