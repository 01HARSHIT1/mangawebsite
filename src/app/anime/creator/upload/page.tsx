"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import CreatorUpgradeModal from "@/components/CreatorUpgradeModal";
import AnimeDashboardLayout from "@/components/anime/creator/AnimeDashboardLayout";

export default function AnimeUploadPage() {
    const { user, isAuthenticated, isCreator } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showCreatorUpgrade, setShowCreatorUpgrade] = useState(false);
    const [form, setForm] = useState({
        title: "",
        creatorName: "",
        description: "",
        genre: "",
        tags: "",
        status: "",
        coverImage: null as File | null,
    });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [coverImageDragActive, setCoverImageDragActive] = useState(false);
    const coverImageRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    async function uploadToCloudinary(file: File, folder: string) {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            setShowLogin(true);
            return;
        }

        if (!form.title || !form.creatorName || !form.description || !form.genre) {
            setMessage("Please fill in all required fields");
            return;
        }
        if (!form.coverImage) {
            setMessage("Please select a cover image");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const token = localStorage.getItem('authToken');
            
            const coverInfo = form.coverImage 
                ? await uploadToCloudinary(form.coverImage, 'anime/series')
                : null;

            if (!coverInfo) {
                throw new Error('Failed to upload cover image');
            }

            const saveRes = await fetch('/api/anime/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'series',
                    title: form.title,
                    creatorName: form.creatorName,
                    description: form.description,
                    genres: form.genre.split(',').map((g: string) => g.trim()),
                    status: form.status || 'ongoing',
                    coverImage: coverInfo.secure_url,
                    tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()) : [],
                })
            });

            const saveData = await saveRes.json();
            if (!saveRes.ok) {
                throw new Error(saveData?.error || 'Failed to save anime series');
            }

            setMessage("Anime series uploaded successfully! You can now add episodes from the creator dashboard.");

            setForm({
                title: "",
                creatorName: "",
                description: "",
                genre: "",
                tags: "",
                status: "",
                coverImage: null,
            });

            if (!isCreator) {
                setTimeout(() => {
                    router.push('/become-creator');
                }, 2000);
            } else {
                setTimeout(() => {
                    router.push('/anime/creator/dashboard');
                }, 2000);
            }
        } catch (err) {
            setMessage("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimeDashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Upload Anime Series</h1>
                    <p className="text-orange-400">Share your anime with the world</p>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-8 border border-orange-500/20">
                    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">🎬</span>
                                        Anime Title
                                        <span className="text-red-400 ml-1">*</span>
                                    </span>
                                </label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-950 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                                    placeholder="Enter anime series title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">👤</span>
                                        Creator Name
                                        <span className="text-red-400 ml-1">*</span>
                                    </span>
                                </label>
                                <input
                                    name="creatorName"
                                    value={form.creatorName || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-950 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                                    placeholder="e.g., Studio Ghibli"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
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
                                    className="w-full px-4 py-3 bg-gray-950 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                                    placeholder="Describe your anime series..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">🏷️</span>
                                        Genres
                                        <span className="text-red-400 ml-1">*</span>
                                    </span>
                                </label>
                                <input
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-950 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                                    placeholder="Action, Drama, Fantasy (comma separated)"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">📊</span>
                                        Status
                                    </span>
                                </label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-950 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                                >
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="upcoming">Upcoming</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    <span className="flex items-center">
                                        <span className="mr-2">🖼️</span>
                                        Cover Image
                                        <span className="text-red-400 ml-1">*</span>
                                    </span>
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${coverImageDragActive
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-orange-500/30 bg-gray-950/50 hover:border-orange-500/50'
                                        }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setCoverImageDragActive(true);
                                    }}
                                    onDragLeave={() => setCoverImageDragActive(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setCoverImageDragActive(false);
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type.startsWith('image/')) {
                                            setForm({ ...form, coverImage: file });
                                        }
                                    }}
                                >
                                    {form.coverImage ? (
                                        <div className="space-y-4">
                                            <img
                                                src={URL.createObjectURL(form.coverImage)}
                                                alt="Cover preview"
                                                className="max-h-48 mx-auto rounded-lg"
                                            />
                                            <p className="text-gray-300">{form.coverImage.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, coverImage: null })}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-gray-400 mb-4">Drag & drop or click to select</p>
                                            <input
                                                ref={coverImageRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setForm({ ...form, coverImage: file });
                                                }}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => coverImageRef.current?.click()}
                                                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Select Cover Image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-2xl shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                                        Upload Anime Series
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

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

                    <CreatorUpgradeModal
                        isOpen={showCreatorUpgrade}
                        onClose={() => setShowCreatorUpgrade(false)}
                        onSuccess={() => {
                            setShowCreatorUpgrade(false);
                            setMessage("Welcome to the creator community! You can now upload anime.");
                        }}
                    />
                </div>
            </div>
        </AnimeDashboardLayout>
    );
}

