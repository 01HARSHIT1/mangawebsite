"use client";
import { useState, useRef } from 'react';
import { FaUpload, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

interface UploadFormData {
    mangaTitle: string;
    creatorName: string;
    description: string;
    genres: string;
    status: string;
    chapterNumber: string;
    chapterTitle: string;
    chapterSubtitle: string;
}

export default function MangaUploadForm() {
    const [formData, setFormData] = useState<UploadFormData>({
        mangaTitle: '',
        creatorName: '',
        description: '',
        genres: '',
        status: 'ongoing',
        chapterNumber: '',
        chapterTitle: '',
        chapterSubtitle: ''
    });

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        success: boolean;
        message: string;
        data?: any;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'cover') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'pdf') {
                if (file.type !== 'application/pdf') {
                    alert('Please select a PDF file');
                    return;
                }
                setPdfFile(file);
            } else {
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                }
                setCoverImage(file);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pdfFile) {
            alert('Please select a PDF file');
            return;
        }

        setIsUploading(true);
        setUploadResult(null);

        try {
            const formDataToSend = new FormData();

            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            // Add files
            formDataToSend.append('pdfFile', pdfFile);
            if (coverImage) {
                formDataToSend.append('coverImage', coverImage);
            }

            const response = await fetch('/api/upload-manga', {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (response.ok) {
                setUploadResult({
                    success: true,
                    message: result.message,
                    data: result.data
                });

                // Reset form on success
                setFormData({
                    mangaTitle: '',
                    creatorName: '',
                    description: '',
                    genres: '',
                    status: 'ongoing',
                    chapterNumber: '',
                    chapterTitle: '',
                    chapterSubtitle: ''
                });
                setPdfFile(null);
                setCoverImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (coverInputRef.current) coverInputRef.current.value = '';

            } else {
                setUploadResult({
                    success: false,
                    message: result.error || 'Upload failed'
                });
            }

        } catch (error) {
            setUploadResult({
                success: false,
                message: 'Network error occurred'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            mangaTitle: '',
            creatorName: '',
            description: '',
            genres: '',
            status: 'ongoing',
            chapterNumber: '',
            chapterTitle: '',
            chapterSubtitle: ''
        });
        setPdfFile(null);
        setCoverImage(null);
        setUploadResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
                        📚 Upload Manga & Chapter
                    </h1>

                    {uploadResult && (
                        <div className={`mb-6 p-4 rounded-lg ${uploadResult.success
                                ? 'bg-green-900 border border-green-600'
                                : 'bg-red-900 border border-red-600'
                            }`}>
                            <div className="flex items-center gap-3">
                                {uploadResult.success ? (
                                    <FaCheck className="text-green-400 text-xl" />
                                ) : (
                                    <FaTimes className="text-red-400 text-xl" />
                                )}
                                <div>
                                    <h3 className={`font-semibold ${uploadResult.success ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                                    </h3>
                                    <p className="text-gray-300">{uploadResult.message}</p>
                                    {uploadResult.success && uploadResult.data && (
                                        <div className="mt-2 text-sm text-gray-400">
                                            <p>Manga ID: {uploadResult.data.mangaId}</p>
                                            <p>Chapter ID: {uploadResult.data.chapterId}</p>
                                            <p>Pages: {uploadResult.data.pageCount}</p>
                                            <p>Size: {(uploadResult.data.totalSize / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Manga Information */}
                        <div className="bg-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-blue-300">📖 Manga Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Manga Title *</label>
                                    <input
                                        type="text"
                                        name="mangaTitle"
                                        value={formData.mangaTitle}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="e.g., One Piece"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Creator Name *</label>
                                    <input
                                        type="text"
                                        name="creatorName"
                                        value={formData.creatorName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="e.g., Eiichiro Oda"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="Brief description of the manga..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Genres</label>
                                    <input
                                        type="text"
                                        name="genres"
                                        value={formData.genres}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="Action, Adventure, Comedy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                    >
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="hiatus">Hiatus</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Chapter Information */}
                        <div className="bg-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-green-300">📑 Chapter Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chapter Number *</label>
                                    <input
                                        type="number"
                                        name="chapterNumber"
                                        value={formData.chapterNumber}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="e.g., 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chapter Title</label>
                                    <input
                                        type="text"
                                        name="chapterTitle"
                                        value={formData.chapterTitle}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="e.g., The Beginning"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Chapter Subtitle</label>
                                    <input
                                        type="text"
                                        name="chapterSubtitle"
                                        value={formData.chapterSubtitle}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="e.g., A new adventure begins..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* File Uploads */}
                        <div className="bg-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-yellow-300">📁 File Uploads</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chapter PDF *</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileChange(e, 'pdf')}
                                        required
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    />
                                    {pdfFile && (
                                        <p className="mt-2 text-sm text-green-400">
                                            ✅ Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cover Image (Optional)</label>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'cover')}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-blue-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    />
                                    {coverImage && (
                                        <p className="mt-2 text-sm text-green-400">
                                            ✅ Selected: {coverImage.name} ({(coverImage.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {isUploading ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <FaUpload />
                                        Upload Manga & Chapter
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Reset Form
                            </button>
                        </div>
                    </form>

                    {/* Information Panel */}
                    <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-300 mb-2">ℹ️ How It Works</h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Upload your manga info and chapter PDF</li>
                            <li>• System automatically converts PDF to high-quality images using Poppler</li>
                            <li>• Images are organized in: <code className="bg-gray-700 px-1 rounded">public/manga-images/{'{creator}'}/{'{manga}'}/chapter-{'{number}'}/</code></li>
                            <li>• Database is updated with correct image paths</li>
                            <li>• Chapter displays properly in the reader with infinite scroll</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
