'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Reorder } from 'framer-motion';
import { 
    FaUpload, FaTrash, FaEye, FaSave, FaTimes, FaArrowLeft,
    FaGripVertical, FaImage, FaFilePdf, FaCheckCircle
} from 'react-icons/fa';
import DashboardLayout from './DashboardLayout';
import Link from 'next/link';

interface ChapterEditorProps {
    seriesId: string;
    chapterId?: string;
}

interface PageItem {
    id: string;
    file: File;
    preview: string;
    uploaded: boolean;
}

export default function ChapterEditor({ seriesId, chapterId }: ChapterEditorProps) {
    const router = useRouter();
    const [chapterTitle, setChapterTitle] = useState('');
    const [chapterNumber, setChapterNumber] = useState('');
    const [pages, setPages] = useState<PageItem[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [uploadMode, setUploadMode] = useState<'images' | 'pdf'>('pdf');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPages: PageItem[] = files.map((file, index) => ({
            id: `page-${Date.now()}-${index}`,
            file,
            preview: URL.createObjectURL(file),
            uploaded: false
        }));
        setPages([...pages, ...newPages]);
    }, [pages]);

    const handlePdfUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
        } else {
            alert('Please select a valid PDF file');
        }
    }, []);

    const handleRemovePage = (pageId: string) => {
        setPages(pages.filter(p => p.id !== pageId));
    };

    const handleSubmit = async () => {
        if (!chapterTitle || !chapterNumber) {
            alert('Please enter chapter title and number');
            return;
        }

        if (uploadMode === 'pdf' && !pdfFile) {
            alert('Please upload a PDF file');
            return;
        }

        if (uploadMode === 'images' && pages.length === 0) {
            alert('Please upload at least one page');
            return;
        }

        setUploading(true);
        setUploadProgress(5);

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('mangaId', seriesId);
            formData.append('chapterNumber', chapterNumber);
            formData.append('title', chapterTitle);

            if (uploadMode === 'pdf' && pdfFile) {
                formData.append('pdf', pdfFile);
            } else {
                pages.forEach((page, index) => {
                    formData.append(`pages`, page.file);
                });
            }

            const response = await fetch('/api/upload-chapter', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setUploadProgress(100);
                alert('Chapter uploaded successfully!');
                router.push(`/creator/dashboard/series/${seriesId}`);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to upload chapter');
            }
        } catch (error) {
            console.error('Error uploading chapter:', error);
            alert('Failed to upload chapter');
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 500);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href={`/creator/dashboard/series/${seriesId}`}
                    className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                    <FaArrowLeft />
                    <span>Back to Series</span>
                </Link>

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {chapterId ? 'Edit Chapter' : 'Add New Chapter'}
                    </h1>
                    <p className="text-gray-400">Upload pages and configure chapter settings</p>
                </div>

                {/* Chapter Info */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-4">Chapter Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Chapter Number *
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={chapterNumber}
                                onChange={(e) => setChapterNumber(e.target.value)}
                                placeholder="e.g., 1 or 1.5"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Chapter Title *
                            </label>
                            <input
                                type="text"
                                value={chapterTitle}
                                onChange={(e) => setChapterTitle(e.target.value)}
                                placeholder="e.g., The Beginning"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Upload Mode Selection */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-4">Upload Method</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setUploadMode('pdf')}
                            className={`p-6 rounded-xl border-2 transition-all ${
                                uploadMode === 'pdf'
                                    ? 'border-purple-500 bg-purple-900/20'
                                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                            }`}
                        >
                            <FaFilePdf className={`text-4xl mb-3 mx-auto ${uploadMode === 'pdf' ? 'text-purple-400' : 'text-gray-400'}`} />
                            <h3 className="font-bold text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-400">Upload a single PDF file (recommended)</p>
                        </button>

                        <button
                            onClick={() => setUploadMode('images')}
                            className={`p-6 rounded-xl border-2 transition-all ${
                                uploadMode === 'images'
                                    ? 'border-purple-500 bg-purple-900/20'
                                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                            }`}
                        >
                            <FaImage className={`text-4xl mb-3 mx-auto ${uploadMode === 'images' ? 'text-purple-400' : 'text-gray-400'}`} />
                            <h3 className="font-bold text-white mb-2">Upload Images</h3>
                            <p className="text-sm text-gray-400">Upload individual page images</p>
                        </button>
                    </div>
                </div>

                {/* Upload Area */}
                {uploadMode === 'pdf' ? (
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">Upload PDF</h2>
                        <div
                            onClick={() => pdfInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl p-12 text-center cursor-pointer transition-all bg-slate-900/30 hover:bg-slate-900/50"
                        >
                            <input
                                ref={pdfInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handlePdfUpload}
                                className="hidden"
                            />
                            {pdfFile ? (
                                <div className="space-y-3">
                                    <FaCheckCircle className="text-6xl text-green-400 mx-auto" />
                                    <p className="text-white font-semibold">{pdfFile.name}</p>
                                    <p className="text-gray-400 text-sm">
                                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPdfFile(null);
                                        }}
                                        className="text-red-400 hover:text-red-300 text-sm font-semibold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <FaFilePdf className="text-6xl text-gray-400 mx-auto mb-4" />
                                    <p className="text-white font-semibold mb-2">Click to upload PDF</p>
                                    <p className="text-gray-400 text-sm">or drag and drop</p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Upload Pages ({pages.length})</h2>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                                <FaUpload />
                                <span>Add Images</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {pages.length > 0 ? (
                            <Reorder.Group
                                axis="y"
                                values={pages}
                                onReorder={setPages}
                                className="space-y-3"
                            >
                                {pages.map((page, index) => (
                                    <Reorder.Item
                                        key={page.id}
                                        value={page}
                                        className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 cursor-move hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <FaGripVertical className="text-gray-400" />
                                            <span className="text-white font-semibold w-12">#{index + 1}</span>
                                            <img
                                                src={page.preview}
                                                alt={`Page ${index + 1}`}
                                                className="w-16 h-20 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{page.file.name}</p>
                                                <p className="text-sm text-gray-400">
                                                    {(page.file.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemovePage(page.id)}
                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl p-12 text-center cursor-pointer transition-all"
                            >
                                <FaImage className="text-6xl text-gray-400 mx-auto mb-4" />
                                <p className="text-white font-semibold mb-2">Click to upload images</p>
                                <p className="text-gray-400 text-sm">or drag and drop</p>
                                <p className="text-gray-500 text-xs mt-2">Supports: JPG, PNG, WebP</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <Link
                        href={`/creator/dashboard/series/${seriesId}`}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes />
                        <span>Cancel</span>
                    </Link>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleSubmit}
                            disabled={uploading || !chapterTitle || !chapterNumber || (uploadMode === 'pdf' ? !pdfFile : pages.length === 0)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Uploading... {uploadProgress}%</span>
                                </>
                            ) : (
                                <>
                                    <FaSave />
                                    <span>Publish Chapter</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Uploading...</span>
                            <span className="text-sm font-semibold text-purple-400">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

