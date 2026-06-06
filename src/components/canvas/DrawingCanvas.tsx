import { createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import type { Component } from 'solid-js';
import {
  Pencil, Eraser, Undo, Redo, Trash2,
  Download, X, Palette, Minus, Plus
} from 'lucide-solid';
import type { DrawingPath } from '../../types';

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (imageDataUrl: string) => void;
  width?: number;
  height?: number;
}

const MAX_HISTORY = 50;

const DrawingCanvas: Component<DrawingCanvasProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;
  
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [tool, setTool] = createSignal<'pen' | 'eraser'>('pen');
  const [color, setColor] = createSignal('#1e293b');
  const [lineWidth, setLineWidth] = createSignal(3);
  const [history, setHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [currentPath, setCurrentPath] = createSignal<DrawingPath | null>(null);
  
  const colors = [
    '#1e293b', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  ];
  
  const canUndo = () => historyIndex() > 0;
  const canRedo = () => historyIndex() < history().length - 1;
  
  const initCanvas = () => {
    if (!canvasRef) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.getBoundingClientRect();
    
    canvasRef.width = rect.width * dpr;
    canvasRef.height = rect.height * dpr;
    
    ctx = canvasRef.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    saveState();
  };
  
  const saveState = () => {
    if (!canvasRef) return;
    
    const dataUrl = canvasRef.toDataURL();
    const newHistory = history().slice(0, historyIndex() + 1);
    newHistory.push(dataUrl);
    
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      setHistoryIndex((prev: number) => prev + 1);
    }
    
    setHistory(newHistory);
    if (newHistory.length > MAX_HISTORY) {
      setHistoryIndex(MAX_HISTORY - 1);
    }
  };
  
  const undo = () => {
    if (!canUndo() || !canvasRef || !ctx) return;
    
    const newIndex = historyIndex() - 1;
    setHistoryIndex(newIndex);
    
    const img = new Image();
    img.onload = () => {
      ctx!.clearRect(0, 0, canvasRef!.width, canvasRef!.height);
      ctx!.drawImage(img, 0, 0, canvasRef!.width / (window.devicePixelRatio || 1), canvasRef!.height / (window.devicePixelRatio || 1));
    };
    img.src = history()[newIndex];
  };
  
  const redo = () => {
    if (!canRedo() || !canvasRef || !ctx) return;
    
    const newIndex = historyIndex() + 1;
    setHistoryIndex(newIndex);
    
    const img = new Image();
    img.onload = () => {
      ctx!.clearRect(0, 0, canvasRef!.width, canvasRef!.height);
      ctx!.drawImage(img, 0, 0, canvasRef!.width / (window.devicePixelRatio || 1), canvasRef!.height / (window.devicePixelRatio || 1));
    };
    img.src = history()[newIndex];
  };
  
  const getPos = (e: MouseEvent | TouchEvent) => {
    if (!canvasRef) return { x: 0, y: 0 };
    
    const rect = canvasRef.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        pressure: touch.force || 1,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: 1,
    };
  };
  
  const startDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    
    const pos = getPos(e);
    
    setCurrentPath({
      points: [{ x: pos.x, y: pos.y, pressure: pos.pressure }],
      color: color(),
      width: lineWidth(),
      tool: tool(),
    });
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool() === 'eraser' ? '#ffffff' : color();
      ctx.lineWidth = tool() === 'eraser' ? lineWidth() * 3 : lineWidth();
    }
  };
  
  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing() || !ctx || !currentPath()) return;
    e.preventDefault();
    
    const pos = getPos(e);
    
    setCurrentPath((prev: DrawingPath | null) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x: pos.x, y: pos.y, pressure: pos.pressure }],
      };
    });
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing()) return;
    setIsDrawing(false);
    setCurrentPath(null);
    saveState();
  };
  
  const clearCanvas = () => {
    if (!ctx || !canvasRef) return;
    
    const rect = canvasRef.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();
  };
  
  const insertImage = () => {
    if (!canvasRef) return;
    const dataUrl = canvasRef.toDataURL('image/png');
    props.onInsert?.(dataUrl);
    props.onClose();
  };
  
  const downloadImage = () => {
    if (!canvasRef) return;
    const dataUrl = canvasRef.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `drawing-${Date.now()}.png`;
    a.click();
  };
  
  onMount(() => {
    if (props.isOpen) {
      setTimeout(initCanvas, 50);
    }
  });
  
  createEffect(() => {
    if (props.isOpen) {
      setTimeout(initCanvas, 50);
    }
  });
  
  if (!props.isOpen) return null;
  
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col fade-in">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">手写画板</h3>
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={props.onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <div class="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50 flex-wrap">
          <div class="flex items-center gap-1 p-1 bg-white rounded-lg border border-gray-200">
            <button
              class={`p-2 rounded-md transition-colors ${
                tool() === 'pen' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setTool('pen')}
              title="画笔"
            >
              <Pencil size={18} />
            </button>
            <button
              class={`p-2 rounded-md transition-colors ${
                tool() === 'eraser' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setTool('eraser')}
              title="橡皮擦"
            >
              <Eraser size={18} />
            </button>
          </div>
          
          <div class="w-px h-8 bg-gray-200" />
          
          <div class="flex items-center gap-1 p-1 bg-white rounded-lg border border-gray-200">
            <button
              class={`p-2 rounded-md transition-colors ${
                canUndo() ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'
              }`}
              onClick={undo}
              disabled={!canUndo()}
              title="撤销"
            >
              <Undo size={18} />
            </button>
            <button
              class={`p-2 rounded-md transition-colors ${
                canRedo() ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'
              }`}
              onClick={redo}
              disabled={!canRedo()}
              title="重做"
            >
              <Redo size={18} />
            </button>
          </div>
          
          <div class="w-px h-8 bg-gray-200" />
          
          <div class="flex items-center gap-2">
            <Palette size={18} class="text-gray-500" />
            <div class="flex gap-1">
              {colors.map(c => (
                <button
                  class={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    color() === c ? 'border-primary-500 scale-110' : 'border-white'
                  }`}
                  style={{ 'background-color': c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
          
          <div class="w-px h-8 bg-gray-200" />
          
          <div class="flex items-center gap-2">
            <Minus size={16} class="text-gray-500" />
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth()}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              class="w-20"
            />
            <Plus size={16} class="text-gray-500" />
            <span class="text-xs text-gray-500 w-6">{lineWidth()}px</span>
          </div>
          
          <div class="flex-1" />
          
          <button
            class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={clearCanvas}
            title="清空画布"
          >
            <Trash2 size={18} />
          </button>
          
          <button
            class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={downloadImage}
            title="下载图片"
          >
            <Download size={18} />
          </button>
        </div>
        
        <div class="flex-1 overflow-hidden bg-gray-100 p-4">
          <canvas
            ref={canvasRef}
            class="w-full h-full bg-white rounded-lg shadow-sm drawing-canvas cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button class="btn-secondary" onClick={props.onClose}>
            取消
          </button>
          <button class="btn-primary" onClick={insertImage}>
            插入到笔记
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
