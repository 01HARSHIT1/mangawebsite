"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import CreatorUpgradeModal from "@/components/CreatorUpgradeModal";

function UploadPageContent() {
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isCreator } = useAuth();
    const [uploadType, setUploadType] = useState<string | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showCreatorUpgrade, setShowCreatorUpgrade] = useState(false);
    const [form, setForm] = useState({
        title: "",
        creatorName: "",
        description: "",
        genre: "",
        chapterNumber: "",
        tags: "",
        status: "",
        coverImage: null as File | null,
        pdfFile: null as File | null,
        mangaId: "",
        subtitle: "",
        coverPage: null as File | null,
    });
    const [mangaList, setMangaList] = useState<{ _id: string; title: string }[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [coverImageDragActive, setCoverImageDragActive] = useState(false);
    const [pdfFileDragActive, setPdfFileDragActive] = useState(false);
    const [coverPageDragActive, setCoverPageDragActive] = useState(false);
    // Separate refs for each file input to ensure complete isolation
    const coverImageRef = useRef<HTMLInputElement | null>(null);
    const pdfFileRef = useRef<HTMLInputElement | null>(null);
    const coverPageRef = useRef<HTMLInputElement | null>(null);
    const pdfFileChapterRef = useRef<HTMLInputElement | null>(null);

    const router = useRouter();

    async function uploadToCloudinary(file: File, folder: string) {
        // 1) ask server for a signed payload
        const signRes = await fetch('/api/cloudinary/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder, resource_type: 'auto' })
        });
        if (!signRes.ok) {
            const t = await signRes.text();
            throw new Error(`Failed to sign upload: ${t}`);
        }
        const { cloudName, apiKey, timestamp, folder: signedFolder, signature } = await signRes.json();

        // 2) upload file directly to Cloudinary
        const fd = new FormData();
        fd.append('file', file);
        fd.append('api_key', apiKey);
        fd.append('timestamp', String(timestamp));
        fd.append('signature', signature);
        if (signedFolder) fd.append('folder', signedFolder);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        const upRes = await fetch(uploadUrl, { method: 'POST', body: fd });
        const ct = upRes.headers.get('content-type') || '';
        const upData: any = ct.includes('application/json') ? await upRes.json() : { error: await upRes.text() };
        if (!upRes.ok || upData.error) {
            throw new Error(typeof upData.error === 'string' ? upData.error : (upData.error?.message || 'Cloudinary upload failed'));
        }
        return { public_id: upData.public_id, secure_url: upData.secure_url };
    }

    useEffect(() => {
        const type = searchParams?.get("type");
        const mangaId = searchParams?.get("mangaId");

        if (type === "manga" || type === "chapter") {
            setUploadType(type);
        }

        // Reset form state on mount to ensure clean state
        setForm({
            title: "",
            creatorName: "",
            description: "",
            genre: "",
            chapterNumber: "",
            tags: "",
            status: "",
            coverImage: null,
            pdfFile: null,
            mangaId: mangaId || "",
            subtitle: "",
            coverPage: null,
        });
        setMessage("");

        console.log('URL params:', { type, mangaId });

    }, [searchParams]);

    useEffect(() => {
        if (uploadType === "chapter") {
            console.log('Fetching manga list for chapter upload...');
            const token = localStorage.getItem('authToken');
            fetch("/api/manga?myManga=true", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    console.log('Manga API response:', data);
                    if (data.manga && Array.isArray(data.manga)) {
                        const mangaOptions = data.manga.map((m: any) => ({ _id: m._id, title: m.title }));
                        setMangaList(mangaOptions);
                        console.log('Available manga (creator\'s own):', mangaOptions);

                        // If mangaId is in the query, pre-select it
                        const urlParams = new URLSearchParams(window.location.search);
                        const preselectId = urlParams.get("mangaId");
                        console.log('Pre-selecting mangaId:', preselectId);
                        if (preselectId) {
                            setForm(f => ({ ...f, mangaId: preselectId }));
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching manga list:', error);
                    setMessage('Error loading manga list');
                });
        }
    }, [uploadType]);

    const handleTypeChange = (type: string) => {
        setUploadType(type);
        setMessage("");



        // Clear form file states
        setForm(prev => ({
            ...prev,
            coverImage: null,
            pdfFile: null,
            coverPage: null
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, files } = e.target as any;
        if (files) {
            setForm((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Fixed file change handlers - removed problematic event handling
    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            console.log('Cover image selected:', file.name, file.type);

            // Validate image file type
            if (file.type.startsWith('image/')) {
                setForm((prev) => ({ ...prev, coverImage: file }));
                setMessage("Cover image selected successfully!");
            } else {
                setMessage("Please select a valid image file (PNG, JPG, JPEG, etc.)");
                e.target.value = '';
            }
        }
    };

    const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            console.log('PDF file selected:', file.name, file.type);

            // Validate PDF file type
            if (file.type === 'application/pdf') {
                setForm((prev) => ({ ...prev, pdfFile: file }));
                setMessage("PDF file selected successfully!");
            } else {
                setMessage("Please select a valid PDF file");
                e.target.value = '';
            }
        }
    };

    const handleCoverPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            console.log('Cover page selected:', file.name, file.type);

            // Validate image file type
            if (file.type.startsWith('image/')) {
                setForm((prev) => ({ ...prev, coverPage: file }));
                setMessage("Cover page selected successfully!");
            } else {
                setMessage("Please select a valid image file (PNG, JPG, JPEG, etc.)");
                e.target.value = '';
            }
        }
    };

    const handlePdfFileChapterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            console.log('Chapter PDF file selected:', file.name, file.type);

            // Validate PDF file type
            if (file.type === 'application/pdf') {
                setForm((prev) => ({ ...prev, pdfFile: file }));
                setMessage("Chapter PDF file selected successfully!");
            } else {
                setMessage("Please select a valid PDF file");
                e.target.value = '';
            }
        }
    };
    // Drag-and-drop handlers
    const handleDrag = (e: React.DragEvent<HTMLDivElement>, dragState: boolean, setDragState: (value: boolean) => void) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragState(true);
        else if (e.type === "dragleave") setDragState(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, name: string, setDragState: (value: boolean) => void) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];

            // Validate file type based on the field name
            if (name === 'coverImage' || name === 'coverPage') {
                if (file.type.startsWith('image/')) {
                    setForm((prev) => ({ ...prev, [name]: file }));
                } else {
                    setMessage("Please select a valid image file (PNG, JPG, JPEG, etc.)");
                }
            } else if (name === 'pdfFile') {
                if (file.type === 'application/pdf') {
                    setForm((prev) => ({ ...prev, [name]: file }));
                } else {
                    setMessage("Please select a valid PDF file");
                }
            }
        }
    };
    // Simplified click handlers to prevent infinite loops
    const triggerCoverImageInput = () => {
        if (coverImageRef.current) {
            coverImageRef.current.click();
        }
    };

    const triggerPdfFileInput = () => {
        if (pdfFileRef.current) {
            pdfFileRef.current.click();
        }
    };

    const triggerCoverPageInput = () => {
        if (coverPageRef.current) {
            coverPageRef.current.click();
        }
    };

    const triggerPdfFileChapterInput = () => {
        if (pdfFileChapterRef.current) {
            pdfFileChapterRef.current.click();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check authentication
        if (!isAuthenticated) {
            setShowLogin(true);
            return;
        }

        // Client-side validation
        if (uploadType === "manga") {
            if (!form.title || !form.creatorName || !form.description || !form.genre || !form.chapterNumber) {
                setMessage("Please fill in all required fields");
                return;
            }
            if (!form.coverImage) {
                setMessage("Please select a cover image");
                return;
            }
            if (!form.pdfFile) {
                setMessage("Please select a PDF file");
                return;
            }
        } else if (uploadType === "chapter") {
            console.log('Chapter validation - form data:', {
                mangaId: form.mangaId,
                chapterNumber: form.chapterNumber,
                description: form.description,
                coverPage: form.coverPage,
                pdfFile: form.pdfFile
            });

            // More detailed validation
            if (!form.mangaId) {
                setMessage("Please select a manga");
                return;
            }
            if (!form.chapterNumber) {
                setMessage("Please enter chapter number");
                return;
            }
            if (!form.description) {
                setMessage("Please enter description");
                return;
            }
            if (!form.coverPage) {
                setMessage("Please select a cover page");
                return;
            }
            if (!form.pdfFile) {
                setMessage("Please select a PDF file");
                return;
            }
        }

        setLoading(true);
        setMessage("");
        const formData = new FormData();

        if (uploadType === "manga") {
            // Use new upload-manga API for manga uploads
            formData.append("mangaTitle", form.title);
            formData.append("creatorName", form.creatorName);
            formData.append("description", form.description);
            formData.append("genres", form.genre);
            formData.append("status", form.status || "ongoing");
            formData.append("chapterNumber", form.chapterNumber);
            formData.append("chapterTitle", `Chapter ${form.chapterNumber}`);
            formData.append("chapterSubtitle", "");
            if (form.coverImage) formData.append("coverImage", form.coverImage);
            if (form.pdfFile) formData.append("pdfFile", form.pdfFile);

            try {
                const token = localStorage.getItem('authToken');
                // Direct uploads
                const [coverInfo, pdfInfo] = await Promise.all([
                    form.coverImage ? uploadToCloudinary(form.coverImage, 'mangawebsite/covers') : Promise.reject(new Error('Missing cover image')),
                    form.pdfFile ? uploadToCloudinary(form.pdfFile, 'mangawebsite/pdfs') : Promise.reject(new Error('Missing PDF file')),
                ]);

                // Save metadata
                const saveRes = await fetch('/api/upload-metadata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'manga',
                        userId: (user as any)?._id || (user as any)?.id,
                        manga: {
                            title: form.title,
                            creatorName: form.creatorName,
                            description: form.description,
                            genres: form.genre,
                            status: form.status || 'ongoing',
                            chapterNumber: form.chapterNumber,
                            chapterTitle: `Chapter ${form.chapterNumber}`,
                            chapterSubtitle: '',
                            coverImage: coverInfo,
                            pdfFile: pdfInfo,
                        }
                    })
                });
                const saveData = await saveRes.json();
                if (!saveRes.ok) throw new Error(saveData?.error || 'Failed to save manga');

                setMessage("Manga uploaded successfully! Please complete your creator profile.");

                // Reset form
                setForm({
                    title: "",
                    creatorName: "",
                    description: "",
                    genre: "",
                    chapterNumber: "",
                    tags: "",
                    status: "",
                    coverImage: null,
                    pdfFile: null,
                    mangaId: "",
                    subtitle: "",
                    coverPage: null,
                });

                // Go to Become Creator page instead of Add Chapter
                router.push('/become-creator');
            } catch (err) {
                setMessage("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
            }
        } else if (uploadType === "chapter") {
            // Use new upload-manga API for chapter uploads
            // First get manga info to get creator name
            try {
                const token = localStorage.getItem('authToken');
                const mangaRes = await fetch(`/api/manga/${form.mangaId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const mangaData = await mangaRes.json();

                if (mangaRes.ok && mangaData.manga) {
                    // Direct uploads for chapter
                    const [coverInfo, pdfInfo] = await Promise.all([
                        form.coverPage ? uploadToCloudinary(form.coverPage, 'mangawebsite/covers') : Promise.reject(new Error('Missing cover page')),
                        form.pdfFile ? uploadToCloudinary(form.pdfFile, 'mangawebsite/pdfs') : Promise.reject(new Error('Missing PDF file')),
                    ]);

                    // Save chapter metadata
                    const saveRes = await fetch('/api/upload-metadata', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            type: 'chapter',
                            userId: (user as any)?._id || (user as any)?.id,
                            mangaId: form.mangaId,
                            chapter: {
                                chapterNumber: form.chapterNumber,
                                chapterTitle: `Chapter ${form.chapterNumber}`,
                                chapterSubtitle: form.subtitle || '',
                                description: form.description,
                                coverImage: coverInfo,
                                pdfFile: pdfInfo,
                            }
                        })
                    });
                    const saveData = await saveRes.json();
                    if (!saveRes.ok) throw new Error(saveData?.error || 'Failed to save chapter');

                    if (saveRes.ok) {
                        setMessage("Chapter uploaded successfully! Your manga is now live on the website!");

                        // If the user isn't a creator yet, navigate to become-creator page to complete profile
                        if (!isCreator) {
                            router.push('/become-creator');
                        }

                        // Reset form
                        setForm({
                            title: "",
                            creatorName: "",
                            description: "",
                            genre: "",
                            chapterNumber: "",
                            tags: "",
                            status: "",
                            coverImage: null,
                            pdfFile: null,
                            mangaId: "",
                            subtitle: "",
                            coverPage: null,
                        });
                    } else {
                        const errMsg = saveData?.error || "Upload failed";
                        setMessage(errMsg.includes('Entity Too Large') || errMsg.startsWith('Request En')
                            ? 'File too large for server (possible 4.5MB limit).'
                            : errMsg);
                    }
                } else {
                    setMessage("Failed to get manga information");
                }
            } catch (err) {
                setMessage("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
            }
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-6 sm:py-10 md:py-12 px-3 sm:px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                        <span className="text-3xl">📚</span>
                    </div>
                    <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Upload Content
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Share your manga with the world. Upload new series or add chapters to existing ones.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 border border-purple-500/20 backdrop-blur-md">
                    <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center">
                        <button
                            onClick={() => handleTypeChange("manga")}
                            className={`group relative px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${uploadType === "manga"
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/25"
                                : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-gray-600"
                                }`}
                            aria-label="Switch to Manga Upload"
                        >
                            <span className="relative z-10 flex items-center">
                                <span className="mr-2">📖</span>
                                New Manga
                            </span>
                            {uploadType === "manga" && (
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20"></div>
                            )}
                        </button>
                        <button
                            onClick={() => handleTypeChange("chapter")}
                            className={`group relative px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${uploadType === "chapter"
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/25"
                                : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-gray-600"
                                }`}
                            aria-label="Switch to Chapter Upload"
                        >
                            <span className="relative z-10 flex items-center">
                                <span className="mr-2">📄</span>
                                Add Chapter
                            </span>
                            {uploadType === "chapter" && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-20"></div>
                            )}
                        </button>
                    </div>
                    {uploadType === "manga" && (
                        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📖</span>
                                            Manga Title
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="title"
                                            value={form.title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="Enter manga title"
                                            aria-label="Manga Title"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">📚</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">👤</span>
                                            Creator Name
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="creatorName"
                                            value={form.creatorName || ""}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="e.g., Eiichiro Oda"
                                            aria-label="Creator Name"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">✍️</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">📝</span>
                                        Description
                                        <span className="text-red-400 ml-1">*</span>
                                    </span>
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                                    placeholder="Describe your manga story, characters, and themes..."
                                    aria-label="Manga Description"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">🏷️</span>
                                            Genre
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="genre"
                                            value={form.genre}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="e.g., Action, Romance"
                                            aria-label="Manga Genre"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">🎭</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📄</span>
                                            Chapter Number
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="chapterNumber"
                                            value={form.chapterNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="1"
                                            aria-label="Chapter Number"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">🔢</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📊</span>
                                            Status
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="e.g., Ongoing, Completed"
                                            aria-label="Status"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">📈</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">🏷️</span>
                                        Tags (comma separated)
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        name="tags"
                                        value={form.tags}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                        placeholder="adventure, fantasy, shounen, action"
                                        aria-label="Tags"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <span className="text-gray-400">🔖</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">🖼️</span>
                                            Cover Image
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div
                                        className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${coverImageDragActive
                                            ? 'border-blue-400 bg-blue-500/10 scale-105'
                                            : 'border-gray-600 bg-slate-700/30 hover:border-blue-500 hover:bg-slate-700/50'
                                            }`}
                                        onDragEnter={(e) => handleDrag(e, coverImageDragActive, setCoverImageDragActive)}
                                        onDragOver={(e) => handleDrag(e, coverImageDragActive, setCoverImageDragActive)}
                                        onDragLeave={(e) => handleDrag(e, coverImageDragActive, setCoverImageDragActive)}
                                        onDrop={(e) => handleDrop(e, 'coverImage', setCoverImageDragActive)}
                                        tabIndex={0}
                                        aria-label="Drag and drop cover image or click to select"
                                        onClick={triggerCoverImageInput}
                                    >
                                        {form.coverImage ? (
                                            <div className="flex flex-col items-center">
                                                <img src={URL.createObjectURL(form.coverImage)} alt="Cover Preview" className="w-24 h-32 object-cover rounded-lg shadow-lg mb-3" />
                                                <span className="text-sm text-gray-300 font-medium">{form.coverImage.name}</span>
                                                <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📷</span>
                                                </div>
                                                <span className="text-gray-300 font-medium">Drop cover image here</span>
                                                <span className="text-gray-400 text-sm mt-1">or click to browse</span>
                                            </div>
                                        )}
                                        <input
                                            key="cover-image-input"
                                            ref={coverImageRef}
                                            id="cover-image-input"
                                            name="coverImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverImageChange}
                                            className="hidden"
                                            aria-label="Cover Image File Input"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📄</span>
                                            PDF File
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div
                                        className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${pdfFileDragActive
                                            ? 'border-purple-400 bg-purple-500/10 scale-105'
                                            : 'border-gray-600 bg-slate-700/30 hover:border-purple-500 hover:bg-slate-700/50'
                                            }`}
                                        onDragEnter={(e) => handleDrag(e, pdfFileDragActive, setPdfFileDragActive)}
                                        onDragOver={(e) => handleDrag(e, pdfFileDragActive, setPdfFileDragActive)}
                                        onDragLeave={(e) => handleDrag(e, pdfFileDragActive, setPdfFileDragActive)}
                                        onDrop={(e) => handleDrop(e, 'pdfFile', setPdfFileDragActive)}
                                        tabIndex={0}
                                        aria-label="Drag and drop PDF file or click to select"
                                        onClick={triggerPdfFileInput}
                                    >
                                        {form.pdfFile ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📄</span>
                                                </div>
                                                <span className="text-sm text-gray-300 font-medium">{form.pdfFile.name}</span>
                                                <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📄</span>
                                                </div>
                                                <span className="text-gray-300 font-medium">Drop PDF file here</span>
                                                <span className="text-gray-400 text-sm mt-1">or click to browse</span>
                                            </div>
                                        )}
                                        <input
                                            key="pdf-file-input"
                                            ref={pdfFileRef}
                                            id="pdf-file-input"
                                            name="pdfFile"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfFileChange}
                                            className="hidden"
                                            aria-label="PDF File Input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span className="relative z-10 flex items-center justify-center">
                                        {loading ? (
                                            <>
                                                <span className="mr-2 animate-spin">🔄</span>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-2">🚀</span>
                                                Upload Manga
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                </button>
                            </div>
                        </form>
                    )}
                    {uploadType === "chapter" && (
                        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📚</span>
                                            Select Manga
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="mangaId"
                                            value={form.mangaId}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-300 appearance-none"
                                            aria-label="Select Manga"
                                        >
                                            <option value="">Choose a manga series</option>
                                            {mangaList.map(m => (
                                                <option key={m._id} value={m._id}>{m.title}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400">📖</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📄</span>
                                            Chapter Number
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="chapterNumber"
                                            value={form.chapterNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="e.g., 1, 2, 3..."
                                            aria-label="Chapter Number"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">🔢</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">📝</span>
                                        Chapter Subtitle
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        name="subtitle"
                                        value={form.subtitle || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                        placeholder="Optional chapter subtitle"
                                        aria-label="Subtitle"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <span className="text-gray-400">🏷️</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">📖</span>
                                        Chapter Description
                                        <span className="text-red-400 ml-1">*</span>
                                    </span>
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                                    placeholder="Describe what happens in this chapter..."
                                    aria-label="Chapter Description"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">🖼️</span>
                                            Cover Page
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div
                                        className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${coverPageDragActive
                                            ? 'border-pink-400 bg-pink-500/10 scale-105'
                                            : 'border-gray-600 bg-slate-700/30 hover:border-pink-500 hover:bg-slate-700/50'
                                            }`}
                                        onDragEnter={(e) => handleDrag(e, coverPageDragActive, setCoverPageDragActive)}
                                        onDragOver={(e) => handleDrag(e, coverPageDragActive, setCoverPageDragActive)}
                                        onDragLeave={(e) => handleDrag(e, coverPageDragActive, setCoverPageDragActive)}
                                        onDrop={(e) => handleDrop(e, 'coverPage', setCoverPageDragActive)}
                                        tabIndex={0}
                                        aria-label="Drag and drop cover page or click to select"
                                        onClick={triggerCoverPageInput}
                                    >
                                        {form.coverPage ? (
                                            <div className="flex flex-col items-center">
                                                <img src={URL.createObjectURL(form.coverPage)} alt="Cover Page Preview" className="w-24 h-32 object-cover rounded-lg shadow-lg mb-3" />
                                                <span className="text-sm text-gray-300 font-medium">{form.coverPage.name}</span>
                                                <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📷</span>
                                                </div>
                                                <span className="text-gray-300 font-medium">Drop cover page here</span>
                                                <span className="text-gray-400 text-sm mt-1">or click to browse</span>
                                            </div>
                                        )}
                                        <input
                                            key="cover-page-input"
                                            ref={coverPageRef}
                                            id="cover-page-input"
                                            name="coverPage"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverPageChange}
                                            className="hidden"
                                            aria-label="Cover Page File Input"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">
                                        <span className="flex items-center">
                                            <span className="mr-2">📄</span>
                                            PDF File
                                            <span className="text-red-400 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div
                                        className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${pdfFileDragActive
                                            ? 'border-purple-400 bg-purple-500/10 scale-105'
                                            : 'border-gray-600 bg-slate-700/30 hover:border-purple-500 hover:bg-slate-700/50'
                                            }`}
                                        onDragEnter={(e) => handleDrag(e, pdfFileDragActive, setPdfFileDragActive)}
                                        onDragOver={(e) => handleDrag(e, pdfFileDragActive, setPdfFileDragActive)}
                                        onDragLeave={(e) => handleDrag(e, pdfFileDragActive, setPdfFileDragActive)}
                                        onDrop={(e) => handleDrop(e, 'pdfFile', setPdfFileDragActive)}
                                        tabIndex={0}
                                        aria-label="Drag and drop PDF file or click to select"
                                        onClick={triggerPdfFileChapterInput}
                                    >
                                        {form.pdfFile ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📄</span>
                                                </div>
                                                <span className="text-sm text-gray-300 font-medium">{form.pdfFile.name}</span>
                                                <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📄</span>
                                                </div>
                                                <span className="text-gray-300 font-medium">Drop PDF file here</span>
                                                <span className="text-gray-400 text-sm mt-1">or click to browse</span>
                                            </div>
                                        )}
                                        <input
                                            key="pdf-file-input-chapter"
                                            ref={pdfFileChapterRef}
                                            id="pdf-file-input-chapter"
                                            name="pdfFile"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfFileChapterChange}
                                            className="hidden"
                                            aria-label="PDF File Input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span className="relative z-10 flex items-center justify-center">
                                        {loading ? (
                                            <>
                                                <span className="mr-2 animate-spin">🔄</span>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-2">📤</span>
                                                Upload Chapter
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                </button>
                            </div>
                        </form>
                    )}
                    {message && (
                        <div className={`mt-8 p-4 rounded-xl text-center font-semibold ${message.includes('success')
                            ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                            : 'bg-red-500/10 border border-red-500/20 text-red-300'
                            }`} role="status">
                            <div className="flex items-center justify-center">
                                <span className="mr-2">
                                    {message.includes('success') ? '✅' : '⚠️'}
                                </span>
                                {message}
                            </div>
                        </div>
                    )}

                    {/* Authentication Modals */}
                    {showLogin && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900">Login Required</h2>
                                        <button
                                            onClick={() => setShowLogin(false)}
                                            className="text-gray-400 hover:text-gray-600 text-2xl"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-gray-600 mb-4">You need to be logged in to upload manga.</p>
                                    <LoginForm
                                        onSuccess={() => {
                                            setShowLogin(false);
                                            setMessage("Login successful! You can now upload manga.");
                                        }}
                                        onSwitchToRegister={() => {
                                            setShowLogin(false);
                                            setShowRegister(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {showRegister && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                                        <button
                                            onClick={() => setShowRegister(false)}
                                            className="text-gray-400 hover:text-gray-600 text-2xl"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-gray-600 mb-4">Create an account to start uploading manga.</p>
                                    <RegisterForm
                                        onSuccess={() => {
                                            setShowRegister(false);
                                            setMessage("Account created successfully! You can now upload manga.");
                                        }}
                                        onSwitchToLogin={() => {
                                            setShowRegister(false);
                                            setShowLogin(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <CreatorUpgradeModal
                        isOpen={showCreatorUpgrade}
                        onClose={() => setShowCreatorUpgrade(false)}
                        onSuccess={() => {
                            setShowCreatorUpgrade(false);
                            setMessage("Welcome to the creator community! You can now upload manga.");
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function UploadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300 text-xl">Loading upload page...</p>
                </div>
            </div>
        }>
            <UploadPageContent />
        </Suspense>
    );
}

// Prevent static generation
export const dynamic = 'force-dynamic'; 