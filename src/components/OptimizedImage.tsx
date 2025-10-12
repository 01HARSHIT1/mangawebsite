"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaSpinner, FaImage, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    sizes?: string;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    onLoad?: () => void;
    onError?: () => void;
    fallbackSrc?: string;
}

export default function OptimizedImage({
    src,
    alt,
    width = 300,
    height = 400,
    className = '',
    priority = false,
    sizes = '(max-width: 768px) 10vw, (max-width: 1200px) 50vw, 33vw',
    quality = 75,
    placeholder = 'empty',
    blurDataURL,
    onLoad,
    onError,
    fallbackSrc = '/file.svg'
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [currentSrc, setCurrentSrc] = useState(src);
    const imageRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '50px 0px',
                threshold: 0.1
            }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    // Handle image load
    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
    };

    // Handle image error
    const handleError = () => {
        console.error('Image failed to load:', currentSrc);
        if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setHasError(false);
            setIsLoading(true);
        } else {
            setHasError(true);
            setIsLoading(false);
            onError?.();
            console.error('Both main and fallback image failed to load:', src, fallbackSrc);
        }
    };

    // Generate responsive sizes for different breakpoints
    const getResponsiveSizes = () => {
        if (width <= 200) return '200px';
        if (width <= 400) return '(max-width:768px) 200px, 300px';
        if (width <= 600) return '(max-width:768px) 300px, 400px';
        return sizes;
    };

    useEffect(() => {
        console.log('OptimizedImage src:', src, 'currentSrc:', currentSrc, 'isLoading:', isLoading, 'hasError:', hasError);
    }, [src, currentSrc, isLoading, hasError]);

    return (
        <div
            ref={imageRef}
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
        >
            <AnimatePresence>
                {isLoading && isInView ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-gray-800"
                    >
                        <FaSpinner className="animate-spin text-2xl text-blue-400" />
                    </motion.div>
                ) : hasError ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800"
                    >
                        <FaExclamationTriangle className="text-3xl mb-2" />
                        <span className="text-sm">Failed to load image</span>
                    </motion.div>
                ) : isInView && !hasError ? (
                    <motion.div
                        key="image"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={currentSrc}
                            alt={alt}
                            width={width}
                            height={height}
                            className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : ''}`}
                            sizes={getResponsiveSizes()}
                            quality={quality}
                            priority={priority}
                            placeholder={placeholder}
                            blurDataURL={blurDataURL}
                            onLoad={handleLoad}
                            onError={handleError}
                            loading={priority ? 'eager' : 'lazy'}
                            unoptimized={currentSrc.startsWith('/uploads/')}
                        />
                    </motion.div>
                ) : !isInView && !priority ? (
                    <div key="placeholder" className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <FaImage className="text-2xl text-gray-600" />
                    </div>
                ) : null}
            </AnimatePresence>
        </div>
    );
} 