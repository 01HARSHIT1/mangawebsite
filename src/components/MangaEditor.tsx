'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaSave, FaUndo, FaRedo, FaImage, FaText, FaSquare, FaCircle, FaPen, FaEraser, FaEye, FaDownload, FaUsers, FaComments } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface CanvasLayer {
    id: string;
    name: string;
    type: 'background' | 'sketch' | 'ink' | 'color' | 'text' | 'effects';
    visible: boolean;
    opacity: number;
    blendMode: string;
    data: ImageData | null;
}

interface DrawingTool {
    type: 'pen' | 'brush' | 'eraser' | 'text' | 'shape';
    size: number;
    color: string;
    opacity: number;
    settings?: any;
}

interface MangaEditorProps {
    chapterId?: string;
    pageNumber?: number;
    isCollaborative?: boolean;
    initialImage?: string;
    onSave?: (imageData: string) => void;
    onClose?: () => void;
}

export default function MangaEditor({ 
    chapterId, 
    pageNumber = 1, 
    isCollaborative = false,
    initialImage,
    onSave,
    onClose 
}: MangaEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [layers, setLayers] = useState<CanvasLayer[]>([]);
    const [activeLayer, setActiveLayer] = useState<string>('');
    const [currentTool, setCurrentTool] = useState<DrawingTool>({
        type: 'pen',
        size: 2,
        color: '#000000',
        opacity: 1
    });
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showLayers, setShowLayers] = useState(true);
    const [showTools, setShowTools] = useState(true);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [showComments, setShowComments] = useState(false);
    
    const { user } = useAuth();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            setCtx(context);
            
            // Set canvas size
            canvas.width = 800;
            canvas.height = 1200;
            
            // Initialize with white background
            if (context) {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Load initial image if provided
                if (initialImage) {
                    const img = new Image();
                    img.onload = () => {
                        context.drawImage(img, 0, 0, canvas.width, canvas.height);
                        saveToHistory();
                    };
                    img.src = initialImage;
                }
                
                // Initialize layers
                initializeLayers();
            }
        }
    }, [initialImage]);

    const initializeLayers = () => {
        const defaultLayers: CanvasLayer[] = [
            {
                id: 'background',
                name: 'Background',
                type: 'background',
                visible: true,
                opacity: 1,
                blendMode: 'normal',
                data: null
            },
            {
                id: 'sketch',
                name: 'Sketch',
                type: 'sketch',
                visible: true,
                opacity: 0.5,
                blendMode: 'normal',
                data: null
            },
            {
                id: 'ink',
                name: 'Ink',
                type: 'ink',
                visible: true,
                opacity: 1,
                blendMode: 'normal',
                data: null
            },
            {
                id: 'color',
                name: 'Color',
                type: 'color',
                visible: true,
                opacity: 1,
                blendMode: 'multiply',
                data: null
            },
            {
                id: 'text',
                name: 'Text',
                type: 'text',
                visible: true,
                opacity: 1,
                blendMode: 'normal',
                data: null
            }
        ];
        
        setLayers(defaultLayers);
        setActiveLayer('sketch');
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!ctx || !canvasRef.current) return;
        
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Set tool properties
        ctx.lineWidth = currentTool.size;
        ctx.strokeStyle = currentTool.color;
        ctx.globalAlpha = currentTool.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (currentTool.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !ctx || !canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
    };

    const saveToHistory = () => {
        if (!canvasRef.current) return;
        
        const imageData = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(imageData);
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0 && canvasRef.current && ctx) {
            setHistoryIndex(historyIndex - 1);
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyIndex - 1];
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1 && canvasRef.current && ctx) {
            setHistoryIndex(historyIndex + 1);
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyIndex + 1];
        }
    };

    const clearCanvas = () => {
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            saveToHistory();
        }
    };

    const saveImage = () => {
        if (canvasRef.current) {
            const imageData = canvasRef.current.toDataURL('image/png');
            
            if (onSave) {
                onSave(imageData);
            } else {
                // Download image
                const link = document.createElement('a');
                link.download = `manga-page-${pageNumber}.png`;
                link.href = imageData;
                link.click();
            }
        }
    };

    const tools = [
        { type: 'pen', icon: FaPen, name: 'Pen' },
        { type: 'brush', icon: FaPen, name: 'Brush' },
        { type: 'eraser', icon: FaEraser, name: 'Eraser' },
        { type: 'text', icon: FaText, name: 'Text' },
        { type: 'shape', icon: FaSquare, name: 'Shapes' }
    ];

    const brushSizes = [1, 2, 5, 10, 20, 30];
    const colors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex">
            {/* Left Sidebar - Tools */}
            <AnimatePresence>
                {showTools && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className="w-80 bg-slate-800 border-r border-purple-500/20 p-4 overflow-y-auto"
                    >
                        <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                            <FaPen />
                            <span>Drawing Tools</span>
                        </h3>

                        {/* Tool Selection */}
                        <div className="mb-6">
                            <h4 className="text-gray-300 text-sm mb-2">Tools</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {tools.map((tool) => (
                                    <button
                                        key={tool.type}
                                        onClick={() => setCurrentTool({ ...currentTool, type: tool.type as any })}
                                        className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 ${
                                            currentTool.type === tool.type
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        <tool.icon />
                                        <span className="text-sm">{tool.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brush Size */}
                        <div className="mb-6">
                            <h4 className="text-gray-300 text-sm mb-2">Brush Size: {currentTool.size}px</h4>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={currentTool.size}
                                onChange={(e) => setCurrentTool({ ...currentTool, size: parseInt(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between mt-2">
                                {brushSizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setCurrentTool({ ...currentTool, size })}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                            currentTool.size === size
                                                ? 'border-purple-400 bg-purple-600'
                                                : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                    >
                                        <div 
                                            className="bg-white rounded-full"
                                            style={{ width: Math.max(2, size / 3), height: Math.max(2, size / 3) }}
                                        ></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="mb-6">
                            <h4 className="text-gray-300 text-sm mb-2">Colors</h4>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setCurrentTool({ ...currentTool, color })}
                                        className={`w-10 h-10 rounded-lg border-2 transition-all duration-300 ${
                                            currentTool.color === color
                                                ? 'border-purple-400 scale-110'
                                                : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    ></button>
                                ))}
                            </div>
                            <input
                                type="color"
                                value={currentTool.color}
                                onChange={(e) => setCurrentTool({ ...currentTool, color: e.target.value })}
                                className="w-full h-10 rounded-lg"
                            />
                        </div>

                        {/* Opacity */}
                        <div className="mb-6">
                            <h4 className="text-gray-300 text-sm mb-2">Opacity: {Math.round(currentTool.opacity * 100)}%</h4>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={currentTool.opacity}
                                onChange={(e) => setCurrentTool({ ...currentTool, opacity: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={clearCanvas}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Clear Canvas
                            </button>
                            <button
                                onClick={() => {/* Add image upload logic */}}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <FaImage />
                                <span>Add Image</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <div className="bg-slate-800 border-b border-purple-500/20 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-white font-semibold">
                            Manga Editor - Page {pageNumber}
                        </h2>
                        
                        {isCollaborative && (
                            <div className="flex items-center space-x-2 text-gray-300">
                                <FaUsers />
                                <span className="text-sm">{collaborators.length} collaborators</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* History Controls */}
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            title="Undo"
                        >
                            <FaUndo />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            title="Redo"
                        >
                            <FaRedo />
                        </button>

                        {/* View Controls */}
                        <button
                            onClick={() => setShowLayers(!showLayers)}
                            className={`p-2 rounded-lg transition-colors ${
                                showLayers ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            }`}
                            title="Toggle Layers"
                        >
                            <FaEye />
                        </button>
                        
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className={`p-2 rounded-lg transition-colors ${
                                showComments ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            }`}
                            title="Toggle Comments"
                        >
                            <FaComments />
                        </button>

                        {/* Save Controls */}
                        <button
                            onClick={saveImage}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <FaSave />
                            <span>Save</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.download = `manga-page-${pageNumber}.png`;
                                link.href = canvasRef.current?.toDataURL() || '';
                                link.click();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <FaDownload />
                            <span>Export</span>
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="flex-1 flex items-center justify-center p-4 bg-gray-700">
                    <div className="relative bg-white rounded-lg shadow-2xl">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="border border-gray-300 rounded-lg cursor-crosshair"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                        
                        {/* Canvas Overlay for Tools */}
                        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                            {currentTool.type.charAt(0).toUpperCase() + currentTool.type.slice(1)} - {currentTool.size}px
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Layers & Comments */}
            <AnimatePresence>
                {(showLayers || showComments) && (
                    <motion.div
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        exit={{ x: 300 }}
                        className="w-80 bg-slate-800 border-l border-purple-500/20 p-4 overflow-y-auto"
                    >
                        {/* Layers Panel */}
                        {showLayers && (
                            <div className="mb-6">
                                <h3 className="text-white font-semibold mb-4">Layers</h3>
                                <div className="space-y-2">
                                    {layers.map((layer) => (
                                        <div
                                            key={layer.id}
                                            className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                                                activeLayer === layer.id
                                                    ? 'border-purple-400 bg-purple-500/20'
                                                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                            }`}
                                            onClick={() => setActiveLayer(layer.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-sm font-medium">{layer.name}</span>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={layer.visible}
                                                        onChange={(e) => {
                                                            setLayers(layers.map(l => 
                                                                l.id === layer.id ? { ...l, visible: e.target.checked } : l
                                                            ));
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <label className="text-gray-400 text-xs">Opacity</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={layer.opacity}
                                                    onChange={(e) => {
                                                        setLayers(layers.map(l => 
                                                            l.id === layer.id ? { ...l, opacity: parseFloat(e.target.value) } : l
                                                        ));
                                                    }}
                                                    className="w-full mt-1"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments Panel */}
                        {showComments && isCollaborative && (
                            <div>
                                <h3 className="text-white font-semibold mb-4">Comments & Feedback</h3>
                                
                                {/* Add Comment */}
                                <div className="mb-4">
                                    <textarea
                                        placeholder="Add feedback or comment..."
                                        className="w-full bg-slate-700 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        rows={3}
                                    />
                                    <button className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                                        Add Comment
                                    </button>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3">
                                    {comments.length === 0 ? (
                                        <div className="text-center text-gray-400 py-4">
                                            <FaComments className="mx-auto text-2xl mb-2 opacity-50" />
                                            <p className="text-sm">No comments yet</p>
                                        </div>
                                    ) : (
                                        comments.map((comment, index) => (
                                            <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {comment.user.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-white text-sm font-medium">{comment.user}</span>
                                                    <span className="text-gray-400 text-xs">{comment.time}</span>
                                                </div>
                                                <p className="text-gray-300 text-sm">{comment.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Sidebars */}
            <div className="absolute top-4 left-4 flex space-x-2">
                <button
                    onClick={() => setShowTools(!showTools)}
                    className="bg-slate-800/90 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-slate-700/90 transition-colors"
                    title="Toggle Tools"
                >
                    <FaPen />
                </button>
            </div>

            {isCollaborative && (
                <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="bg-slate-800/90 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-slate-700/90 transition-colors"
                        title="Toggle Comments"
                    >
                        <FaComments />
                    </button>
                </div>
            )}
        </div>
    );
}
