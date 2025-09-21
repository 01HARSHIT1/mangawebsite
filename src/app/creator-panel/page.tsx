"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaChartLine, FaMoneyBillWave, FaExclamationTriangle, FaEnvelope, FaShieldAlt, FaCog, FaSignOutAlt, FaBars, FaTimes, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUpload, FaDownload, FaHeart, FaComment, FaShare, FaBookmark, FaStar, FaCalendar, FaClock, FaUser, FaTag, FaGlobe, FaLink, FaImage, FaFileAlt, FaVideo, FaAudio, FaCode, FaPalette, FaMagic, FaRocket, FaTrophy, FaMedal, FaCrown, FaGem, FaDiamond, FaInfinity, FaZap, FaFire, FaSnowflake, FaLeaf, FaSun, FaMoon, FaCloud, FaUmbrella, FaMountain, FaTree, FaFlower, FaSeedling, FaRecycle, FaEco, FaBiohazard, FaRadiation, FaNuclear, FaAtom, FaDna, FaVirus, FaBacteria, FaMicroscope, FaTelescope, FaSatellite, FaSpaceShuttle, FaUfo, FaAlien, FaRobot, FaCyborg, FaAndroid, FaApple, FaWindows, FaLinux, FaUbuntu, FaDebian, FaCentos, FaRedhat, FaSuse, FaArch, FaGentoo, FaSlackware, FaMint, FaZorin, FaElementary, FaPop, FaManjaro, FaEndeavour, FaArco, FaGaruda, FaReborn, FaArtix, FaVoid, FaAlpine, FaTinycore, FaPuppy, FaSlax, FaPorteus, FaKnoppix, FaDamn } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, CartesianGrid, ScatterChart, Scatter, FunnelChart, Funnel, Tooltip, Treemap, TreemapItem } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatorPanel() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dark, setDark] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);
    const [seriesList, setSeriesList] = useState<any[]>([]);
    const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
    const [episodes, setEpisodes] = useState<{ [key: string]: any[] }>({});
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'earnings' | 'settings'>('overview');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        genre: '',
        coverImage: null as File | null,
        seriesType: 'manga'
    });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteType, setDeleteType] = useState<'series' | 'episode'>('series');
    const router = useRouter();
    const { user: authUser, logout } = useAuth();

    useEffect(() => {
        if (!authUser) {
            router.push("/login");
            return;
        }

        if (authUser.role !== "creator" && authUser.role !== "admin") {
            router.push("/");
            return;
        }

        setUser(authUser);
        setLoading(false);
    }, [authUser, router]);

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [dark]);

    // Fetch analytics for creator
    useEffect(() => {
        if (!authUser) return;
        fetch("/api/creator-analytics", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(setAnalytics);
    }, [authUser]);

    // Fetch creator's series for management
    useEffect(() => {
        if (!authUser) return;
        fetch("/api/manga", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setSeriesList(Array.isArray(data) ? data.filter((m: any) => m.uploaderId === authUser.id) : []);
            });
    }, [authUser]);

    // ... existing code ...
} 