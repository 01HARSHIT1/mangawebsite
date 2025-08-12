"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function UploadPage() {
    const searchParams = useSearchParams();
    const [uploadType, setUploadType] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
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

    useEffect(() => {
        const type = searchParams.get("type");
        const mangaId = searchParams.get("mangaId");

        if (type === "manga" || type === "chapter") {
            setUploadType(type);
        }

        // Reset form state on mount to ensure clean state
        setForm({
            title: "",
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
            fetch("/api/manga")
                .then(res => res.json())
                .then(data => {
                    console.log('Manga API response:', data);
                    if (data.manga && Array.isArray(data.manga)) {
                        const mangaOptions = data.manga.map((m: any) => ({ _id: m._id, title: m.title }));
                        setMangaList(mangaOptions);
                        console.log('Available manga:', mangaOptions);

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

        // Client-side validation
        if (uploadType === "manga") {
            if (!form.title || !form.description || !form.genre || !form.chapterNumber) {
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
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("genre", form.genre);
            formData.append("chapterNumber", form.chapterNumber);
            formData.append("tags", form.tags);
            formData.append("status", form.status);
            if (form.coverImage) formData.append("coverImage", form.coverImage);
            if (form.pdfFile) formData.append("pdfFile", form.pdfFile);
        } else if (uploadType === "chapter") {
            formData.append("chapterUpload", "1");
            formData.append("mangaId", form.mangaId);
            formData.append("chapterNumber", form.chapterNumber);
            formData.append("subtitle", form.subtitle || "");
            formData.append("description", form.description);
            if (form.coverPage) formData.append("coverPage", form.coverPage);
            if (form.pdfFile) formData.append("pdfFile", form.pdfFile);
        }
        try {
            const res = await fetch("/api/manga", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                if (uploadType === "manga" && data.manga && data.manga._id) {
                    // Redirect to chapter upload with new manga pre-selected
                    router.push(`/upload?type=chapter&mangaId=${data.manga._id}`);
                    return;
                }
                setMessage(uploadType === "manga" ? "Manga uploaded successfully!" : "Chapter uploaded successfully!");
                setForm({
                    title: "",
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
                setMessage(data.error || "Upload failed");
            }
        } catch (err) {
            setMessage("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-gray-900 rounded-2xl shadow-2xl text-white">
            <h1 className="text-3xl font-bold mb-6 text-blue-400">Upload</h1>
            <div className="flex gap-4 mb-8">
                <button onClick={() => handleTypeChange("manga")} className={`px-6 py-2 rounded-lg font-semibold shadow ${uploadType === "manga" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"} focus:ring-2 focus:ring-blue-400 focus:outline-none`} aria-label="Switch to Manga Upload">Manga Upload</button>
                <button onClick={() => handleTypeChange("chapter")} className={`px-6 py-2 rounded-lg font-semibold shadow ${uploadType === "chapter" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"} focus:ring-2 focus:ring-blue-400 focus:outline-none`} aria-label="Switch to Chapter Upload">Chapter Upload</button>
            </div>
            {uploadType === "manga" && (
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
                    <div>
                        <label className="block font-semibold mb-1">Title <span className="text-red-400">*</span></label>
                        <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Manga Title" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Description <span className="text-red-400">*</span></label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Manga Description" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Genre <span className="text-red-400">*</span></label>
                        <input name="genre" value={form.genre} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Manga Genre" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Chapter Number <span className="text-red-400">*</span></label>
                        <input name="chapterNumber" value={form.chapterNumber} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Chapter Number" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Tags (comma separated)</label>
                        <input name="tags" value={form.tags} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Tags" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Status</label>
                        <input name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Status" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Cover Image <span className="text-red-400">*</span></label>
                        <div
                            className={`w-full p-4 border-2 border-dashed rounded-lg cursor-pointer ${coverImageDragActive ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-gray-800'}`}
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
                                    <img src={URL.createObjectURL(form.coverImage)} alt="Cover Preview" className="w-32 h-44 object-cover rounded shadow mb-2" />
                                    <span className="text-sm text-gray-300">{form.coverImage.name}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400">Drag & drop or click to select cover image</span>
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
                    <div>
                        <label className="block font-semibold mb-1">PDF File <span className="text-red-400">*</span></label>
                        <div
                            className={`w-full p-4 border-2 border-dashed rounded-lg cursor-pointer ${pdfFileDragActive ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-gray-800'}`}
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
                                    <span className="text-sm text-gray-300">{form.pdfFile.name}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400">Drag & drop or click to select PDF file</span>
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
                    <button type="submit" disabled={loading} className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-lg shadow focus:ring-2 focus:ring-blue-400 focus:outline-none transition">{loading ? "Uploading..." : "Upload"}</button>
                </form>
            )}
            {uploadType === "chapter" && (
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
                    <div>
                        <label className="block font-semibold mb-1">Manga <span className="text-red-400">*</span></label>
                        <select name="mangaId" value={form.mangaId} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Select Manga">
                            <option value="">Select manga</option>
                            {mangaList.map(m => (
                                <option key={m._id} value={m._id}>{m.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Chapter Number <span className="text-red-400">*</span></label>
                        <input name="chapterNumber" value={form.chapterNumber} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Chapter Number" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Subtitle</label>
                        <input name="subtitle" value={form.subtitle || ""} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Subtitle" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Description <span className="text-red-400">*</span></label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Chapter Description" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Cover Page <span className="text-red-400">*</span></label>
                        <div
                            className={`w-full p-4 border-2 border-dashed rounded-lg cursor-pointer ${coverPageDragActive ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-gray-800'}`}
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
                                    <img src={URL.createObjectURL(form.coverPage)} alt="Cover Page Preview" className="w-32 h-44 object-cover rounded shadow mb-2" />
                                    <span className="text-sm text-gray-300">{form.coverPage.name}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400">Drag & drop or click to select cover page</span>
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
                    <div>
                        <label className="block font-semibold mb-1">PDF File <span className="text-red-400">*</span></label>
                        <div
                            className={`w-full p-4 border-2 border-dashed rounded-lg cursor-pointer ${pdfFileDragActive ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-gray-800'}`}
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
                                    <span className="text-sm text-gray-300">{form.pdfFile.name}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400">Drag & drop or click to select PDF file</span>
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
                    <button type="submit" disabled={loading} className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-lg shadow focus:ring-2 focus:ring-blue-400 focus:outline-none transition">{loading ? "Uploading..." : "Upload"}</button>
                </form>
            )}
            {message && <div className={`mt-6 text-center font-semibold ${message.includes('success') ? 'text-green-400 animate-pulse' : 'text-red-400 animate-pulse'}`} role="status">{message}</div>}
        </div>
    );
} 