"use client";
import Link from "next/link";
import { useState } from "react";

export default function UploadDropdown() {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                style={{ background: "#23272F", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: "16px 32px", fontWeight: 600, fontSize: 18 }}
                onClick={() => setOpen(v => !v)}
            >
                Upload
            </button>
            {open && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: '#23272F', border: '1px solid #333', borderRadius: 8, minWidth: 180, zIndex: 10 }}>
                    <Link href={{ pathname: '/upload', query: { type: 'manga' } }} style={{ display: 'block', padding: '12px 24px', color: '#fff', textDecoration: 'none' }} onClick={() => setOpen(false)}>Upload Manga</Link>
                    <Link href={{ pathname: '/upload', query: { type: 'chapter' } }} style={{ display: 'block', padding: '12px 24px', color: '#fff', textDecoration: 'none' }} onClick={() => setOpen(false)}>Upload Chapter</Link>
                </div>
            )}
        </div>
    );
} 