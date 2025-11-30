'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceAssistantProps {
    onCommand?: (command: string, params?: any) => void;
    enabled?: boolean;
    showUI?: boolean;
}

interface VoiceCommand {
    pattern: RegExp;
    action: string;
    params?: (matches: RegExpMatchArray) => any;
    requiresConfirmation?: boolean;
    restricted?: boolean; // Actions that should never be allowed
}

// Security: Actions that should NEVER be allowed via voice
const RESTRICTED_ACTIONS = [
    'deleteAccount',
    'changePassword',
    'payment',
    'purchase',
    'modifyPayment',
    'accessSensitiveData'
];

// Actions that require confirmation
const CONFIRMATION_REQUIRED = [
    'removeBookmark',
    'clearHistory',
    'logout',
    'removeFromLibrary'
];

export default function VoiceAssistant({ onCommand, enabled = false, showUI = true }: VoiceAssistantProps) {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    // Helper function to get current pathname (with fallback to window.location)
    const getCurrentPathname = () => {
        if (pathname) return pathname;
        if (typeof window !== 'undefined') {
            return window.location.pathname;
        }
        return '';
    };
    
    // Helper function to check if we're on a manga detail page
    const isOnMangaDetailPage = () => {
        const currentPath = getCurrentPathname();
        return currentPath.includes('/manga/') && !currentPath.includes('/chapter/');
    };
    // Persist listening state across navigation
    const [isListening, setIsListening] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('voiceAssistantListening');
            return saved === 'true';
        }
        return false;
    });
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [pendingConfirmation, setPendingConfirmation] = useState<{ action: string; params?: any } | null>(null);
    
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    
    // Persist listening state to sessionStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('voiceAssistantListening', isListening.toString());
        }
    }, [isListening]);
    
    // CRITICAL: Panel ref for position locking - must be declared before any conditional returns
    const panelRef = useRef<HTMLDivElement>(null);

    // Comprehensive voice command patterns
    const commands: VoiceCommand[] = [
        // ========== NAVIGATION & READING CONTROLS ==========
        {
            pattern: /(next|forward|advance|skip)\s+(page|chapter|episode)?/i,
            action: 'next'
        },
        {
            pattern: /(previous|back|go\s+back|return|rewind)\s+(page|chapter|episode)?/i,
            action: 'previous'
        },
        {
            pattern: /(first|beginning|start)\s+(page|chapter)?/i,
            action: 'first'
        },
        {
            pattern: /(last|end|final)\s+(page|chapter)?/i,
            action: 'last'
        },
        {
            pattern: /go\s+to\s+(chapter|episode)\s+(\d+)/i,
            action: 'goToChapter',
            params: (matches) => ({ chapterNumber: parseInt(matches[2]) })
        },
        {
            pattern: /(go\s+to\s+)?page\s+(\d+)/i,
            action: 'goToPage',
            params: (matches) => ({ pageNumber: parseInt(matches[2]) })
        },
        {
            pattern: /(next\s+page|page\s+next)/i,
            action: 'nextPage'
        },
        {
            pattern: /(previous\s+page|prev\s+page|page\s+previous|page\s+back)/i,
            action: 'previousPage'
        },
        {
            pattern: /(first\s+page|page\s+1|page\s+one)/i,
            action: 'goToPage',
            params: () => ({ pageNumber: 1 })
        },
        {
            pattern: /(last\s+page|final\s+page)/i,
            action: 'goToLastPage'
        },
        {
            pattern: /(scroll\s+down|scroll\s+up|scroll\s+downward|scroll\s+upward)/i,
            action: 'scroll',
            params: (matches) => {
                const matchText = matches[0].toLowerCase();
                // Check for 'down' first, then default to 'up'
                if (matchText.includes('down')) {
                    return { direction: 'down' };
                } else if (matchText.includes('up')) {
                    return { direction: 'up' };
                }
                // Fallback: default to down if unclear
                return { direction: 'down' };
            }
        },
        {
            pattern: /(pause\s+reading|stop\s+reading|take\s+a\s+break)/i,
            action: 'pauseReading'
        },
        
        // ========== NAVIGATION TO PAGES ==========
        {
            pattern: /(open|go\s+to|show|navigate\s+to)\s+(my\s+)?library/i,
            action: 'openLibrary'
        },
        {
            pattern: /(open|go\s+to|show)\s+home/i,
            action: 'openHome'
        },
        {
            pattern: /^(open|go\s+to|show)\s+(browse|browser)$/i,
            action: 'openBrowse'
        },
        {
            pattern: /(open|go\s+to|show|browse)\s+manga/i,
            action: 'openBrowse'
        },
        {
            pattern: /(open|go\s+to|show)\s+genres/i,
            action: 'openGenres'
        },
        {
            pattern: /(open|go\s+to|show)\s+search/i,
            action: 'openSearch'
        },
        {
            pattern: /(open|go\s+to|show)\s+(my\s+)?profile/i,
            action: 'openProfile'
        },
        {
            pattern: /(open|go\s+to|show)\s+settings/i,
            action: 'openSettings'
        },
        {
            pattern: /(open|go\s+to|show)\s+statistics/i,
            action: 'openStats'
        },
        {
            pattern: /(open|go\s+to|show)\s+notifications/i,
            action: 'openNotifications'
        },
        {
            pattern: /(open|go\s+to|show)\s+coins/i,
            action: 'openCoins'
        },
        {
            pattern: /(open|go\s+to|show)\s+pricing/i,
            action: 'openPricing'
        },
        {
            pattern: /(open|go\s+to|show)\s+(creator\s+)?dashboard/i,
            action: 'openCreatorDashboard'
        },
        {
            pattern: /(open|go\s+to|show)\s+admin\s+dashboard/i,
            action: 'openAdminDashboard'
        },
        {
            pattern: /(open|go\s+to|show)\s+upload/i,
            action: 'openUpload'
        },
        {
            pattern: /(open|go\s+to|show)\s+become\s+creator/i,
            action: 'openBecomeCreator'
        },
        {
            pattern: /(open|go\s+to|show)\s+login/i,
            action: 'openLogin'
        },
        {
            pattern: /(open|go\s+to|show)\s+sign\s+up|signup/i,
            action: 'openSignup'
        },
        {
            pattern: /(open|go\s+to|show)\s+help/i,
            action: 'openHelp'
        },
        {
            pattern: /(open|go\s+to|show)\s+about/i,
            action: 'openAbout'
        },
        {
            pattern: /(open|go\s+to|show)\s+contact/i,
            action: 'openContact'
        },
        
        // ========== MANGA DETAIL PAGE TABS ==========
        // IMPORTANT: These must come BEFORE openManga pattern to prevent "synopsis" from being treated as manga name
        {
            pattern: /^(open|go\s+to|show)\s+synopsis$/i,
            action: 'openSynopsisTab'
        },
        {
            pattern: /^(open|go\s+to|show)\s+chapters$/i,
            action: 'openChaptersTab'
        },
        {
            pattern: /^(open|go\s+to|show)\s+reviews$/i,
            action: 'openReviewsTab'
        },
        {
            pattern: /(open|read|start)\s+(first\s+)?(visible\s+)?chapter/i,
            action: 'openFirstVisibleChapter'
        },
        {
            pattern: /(open|read|start)\s+this\s+chapter/i,
            action: 'openFirstVisibleChapter'
        },
        
        // ========== SEARCHING MANGA ==========
        {
            pattern: /(search|find)\s+(for\s+)?(.+)/i,
            action: 'search',
            params: (matches) => ({ query: matches[3] })
        },
        {
            pattern: /(search|find)\s+(comedy|action|romance|horror|fantasy|sci-fi|drama|slice\s+of\s+life)\s+manga/i,
            action: 'searchByGenre',
            params: (matches) => ({ genre: matches[2] })
        },
        {
            pattern: /(show|find|search)\s+(latest|recent|new)\s+(updates|manga|chapters)/i,
            action: 'showLatest'
        },
        
        // ========== OPENING MANGA BY NAME ==========
        // IMPORTANT: These patterns must come AFTER page navigation to prevent conflicts
        // Require "manga" keyword OR be more specific to avoid matching page names
        {
            pattern: /(read|start\s+reading|begin\s+reading|open|show)\s+(manga\s+)(.+)/i,
            action: 'openManga',
            params: (matches) => ({ mangaName: matches[3] })
        },
        {
            pattern: /(open|read|start\s+reading|show)\s+(.+)\s+(manga)/i,
            action: 'openManga',
            params: (matches) => ({ mangaName: matches[2] })
        },
        // Fallback: Only match if it's clearly a manga name (not a common page name)
        {
            pattern: /^(open|read|start\s+reading|show)\s+(?!browse|browser|home|library|genres|search|profile|settings|stats|notifications|coins|pricing|dashboard|upload|login|signup|help|about|contact|synopsis|chapters|reviews)(.+)$/i,
            action: 'openManga',
            params: (matches) => ({ mangaName: matches[2] })
        },
        
        // ========== START READING CURRENT MANGA ==========
        // This pattern matches "start reading" or "read" without a manga name (only on manga detail pages)
        // Also matches "open chapter 1", "go to chapter 1", etc.
        // IMPORTANT: Must come AFTER manga search patterns to avoid conflicts
        {
            pattern: /^(start\s+reading|begin\s+reading|read\s+chapter\s+1|read\s+first\s+chapter|go\s+to\s+chapter\s+1|open\s+chapter\s+1|read\s+now)(\s+at\s+this\s+page)?$/i,
            action: 'startReadingCurrentManga'
        },
        
        // ========== PERSONALIZED ASSISTANCE ==========
        {
            pattern: /(show|display|list)\s+(my\s+)?bookmarks/i,
            action: 'showBookmarks'
        },
        {
            pattern: /(what|show|tell\s+me)\s+(did\s+i\s+read\s+last|my\s+last\s+read|what\s+i\s+read\s+last)/i,
            action: 'lastRead'
        },
        {
            pattern: /(continue|resume)\s+(where\s+i\s+left\s+off|reading|from\s+where\s+i\s+stopped)/i,
            action: 'continueReading'
        },
        {
            pattern: /(notify|alert|tell\s+me)\s+(when|if)\s+(a\s+)?new\s+(chapter|update)\s+(arrives|comes|is\s+released)/i,
            action: 'notifyNewChapter'
        },
        
        // ========== BOOKMARKING ==========
        {
            pattern: /(bookmark|save|mark)\s+(this|current|page|chapter)?/i,
            action: 'bookmark'
        },
        {
            pattern: /(bookmark\s+here|save\s+position|remember\s+this)/i,
            action: 'bookmark'
        },
        {
            pattern: /(remove|delete|unbookmark)\s+bookmark/i,
            action: 'removeBookmark',
            requiresConfirmation: true
        },
        
        // ========== CONTENT DISCOVERY ==========
        {
            pattern: /(suggest|recommend|give\s+me)\s+something\s+(funny|comedy|humorous)/i,
            action: 'suggestComedy'
        },
        {
            pattern: /(suggest|recommend|give\s+me)\s+(new\s+)?(action|adventure)\s+manga/i,
            action: 'suggestAction'
        },
        {
            pattern: /(what's|what\s+is)\s+(popular|trending|hot)\s+(today|now|right\s+now)/i,
            action: 'showTrending'
        },
        {
            pattern: /(find|suggest|recommend)\s+(something\s+)?like\s+(.+)/i,
            action: 'suggestSimilar',
            params: (matches) => ({ similarTo: matches[3] })
        },
        {
            pattern: /(find|show)\s+(short|quick)\s+manga\s+(under|below|less\s+than)\s+(\d+)\s+chapters/i,
            action: 'findShortManga',
            params: (matches) => ({ maxChapters: parseInt(matches[4]) })
        },
        {
            pattern: /(show|find|recommend)\s+(romance|romantic)\s+(that\s+is\s+)?(trending|popular)/i,
            action: 'showTrendingRomance'
        },
        
        // ========== HELP & FEATURE EXPLANATIONS ==========
        {
            pattern: /(help|what\s+can\s+you\s+do|commands|available\s+commands)/i,
            action: 'help'
        },
        {
            pattern: /(how\s+do\s+i|how\s+to)\s+bookmark\s+manga/i,
            action: 'helpBookmark'
        },
        {
            pattern: /(how\s+do\s+i|how\s+to)\s+download\s+chapters/i,
            action: 'helpDownload'
        },
        {
            pattern: /(how\s+do\s+i|how\s+to)\s+switch\s+to\s+dark\s+mode/i,
            action: 'helpDarkMode'
        },
        {
            pattern: /(explain|tell\s+me\s+about|what\s+is)\s+(eye\s+tracking|auto\s+brightness|voice\s+assistant)/i,
            action: 'explainFeature',
            params: (matches) => ({ feature: matches[2] })
        },
        
        // ========== READING MODE & SETTINGS ==========
        {
            pattern: /(dark\s+mode|light\s+mode|toggle\s+theme|switch\s+theme)/i,
            action: 'toggleTheme'
        },
        {
            pattern: /(zoom\s+in|zoom\s+out|increase\s+zoom|decrease\s+zoom)/i,
            action: 'zoom',
            params: (matches) => ({ direction: matches[0].toLowerCase().includes('in') || matches[0].toLowerCase().includes('increase') ? 'in' : 'out' })
        },
        {
            pattern: /(brightness\s+up|increase\s+brightness|make\s+brighter)/i,
            action: 'increaseBrightness'
        },
        {
            pattern: /(brightness\s+down|decrease\s+brightness|make\s+darker)/i,
            action: 'decreaseBrightness'
        },
        {
            pattern: /(toggle|enable|disable)\s+eye\s+tracking/i,
            action: 'toggleEyeTracking'
        },
        {
            pattern: /(toggle|enable|disable)\s+auto\s+scroll/i,
            action: 'toggleAutoScroll'
        },
        {
            pattern: /(fullscreen|full\s+screen|enter\s+fullscreen)/i,
            action: 'fullscreen'
        },
        {
            pattern: /(exit\s+fullscreen|leave\s+fullscreen)/i,
            action: 'exitFullscreen'
        },
        
        // ========== QUICK ACTIONS ==========
        {
            pattern: /(like|unlike)/i,
            action: 'toggleLike'
        },
        {
            pattern: /(share|share\s+this)/i,
            action: 'share'
        },
        {
            pattern: /(what\s+chapter|current\s+chapter|which\s+chapter)/i,
            action: 'currentChapter'
        },
        {
            pattern: /(go\s+to\s+manga|open\s+manga|show\s+manga)/i,
            action: 'goToManga'
        },
        
        // ========== RESTRICTED ACTIONS (with security check) ==========
        {
            pattern: /(delete|remove)\s+(my\s+)?account/i,
            action: 'deleteAccount',
            restricted: true
        },
        {
            pattern: /(change|modify|update)\s+(my\s+)?password/i,
            action: 'changePassword',
            restricted: true
        },
        {
            pattern: /(make|do|process)\s+(a\s+)?payment/i,
            action: 'payment',
            restricted: true
        },
        {
            pattern: /(clear|delete|remove)\s+(my\s+)?(reading\s+)?history/i,
            action: 'clearHistory',
            requiresConfirmation: true
        },
        {
            pattern: /(logout|sign\s+out|log\s+out)/i,
            action: 'logout',
            requiresConfirmation: true
        },
        {
            pattern: /(remove|delete)\s+(from\s+)?(my\s+)?library/i,
            action: 'removeFromLibrary',
            requiresConfirmation: true
        },
        
        // ========== CLOSE/EXIT ==========
        {
            pattern: /(close|exit|stop)/i,
            action: 'close'
        }
    ];

    useEffect(() => {
        // Check browser support
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            setIsSupported(!!SpeechRecognition);
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    useEffect(() => {
        if (!enabled || !isSupported || !isAuthenticated) {
            stopListening();
            return;
        }

        // Small delay to ensure DOM is ready after navigation
        const timer = setTimeout(() => {
            if (isListening) {
                startListening();
            } else {
                stopListening();
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            // Don't stop listening on cleanup - let it persist across navigation
            // Only stop if explicitly disabled
            if (!enabled || !isSupported || !isAuthenticated) {
                stopListening();
            }
        };
    }, [enabled, isListening, isSupported, isAuthenticated, pathname]);

    const startListening = () => {
        if (!isSupported) {
            setError('Voice recognition not supported in this browser');
            return;
        }

        // Stop any existing recognition before starting a new one
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors
            }
            recognitionRef.current = null;
        }

        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setError(null);
            };

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscript(finalTranscript || interimTranscript);

                if (finalTranscript) {
                    processCommand(finalTranscript.trim());
                }
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    setTimeout(() => {
                        if (isListening && enabled) {
                            recognition.start();
                        }
                    }, 1000);
                } else if (event.error === 'not-allowed') {
                    setError('Microphone permission denied. Please enable microphone access.');
                    setIsListening(false);
                } else {
                    setError(`Speech recognition error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                if (isListening && enabled) {
                    setTimeout(() => {
                        try {
                            recognition.start();
                        } catch (e) {
                            // Silently handle errors
                        }
                    }, 100);
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (error) {
            setError('Failed to start voice recognition');
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
            recognitionRef.current = null;
        }
    };

    const processCommand = (text: string) => {
        // Handle confirmation responses
        if (pendingConfirmation) {
            if (text.match(/(yes|confirm|ok|sure|proceed|do\s+it)/i)) {
                executeCommand(pendingConfirmation.action, pendingConfirmation.params);
                setPendingConfirmation(null);
                return;
            } else if (text.match(/(no|cancel|abort|stop)/i)) {
                speak('Action cancelled.');
                setPendingConfirmation(null);
                return;
            }
        }

        for (const command of commands) {
            const matches = text.match(command.pattern);
            if (matches) {
                const action = command.action;
                const params = command.params ? command.params(matches) : undefined;
                
                // Security check: Block restricted actions
                if (command.restricted || RESTRICTED_ACTIONS.includes(action)) {
                    speak("I can't perform that action for security reasons. Please use the website interface for sensitive operations.");
                    return;
                }
                
                // Confirmation check
                if (command.requiresConfirmation || CONFIRMATION_REQUIRED.includes(action)) {
                    setPendingConfirmation({ action, params });
                    speak(`Are you sure you want to ${action}? Say yes to confirm or no to cancel.`);
                    return;
                }
                
                executeCommand(action, params);
                return;
            }
        }

        // No command matched
        speak("I didn't understand that command. Say 'help' for available commands.");
    };

    const executeCommand = (action: string, params?: any) => {
        setLastCommand(action);
        
        // Handle navigation commands that VoiceAssistant can do directly
        switch (action) {
            case 'openLibrary':
                router.push('/library');
                speak('Opening your library.');
                break;
            case 'openHome':
                router.push('/');
                speak('Going to home page.');
                break;
            case 'openBrowse':
                router.push('/manga');
                speak('Opening manga browse page.');
                break;
            case 'openGenres':
                router.push('/genres');
                speak('Opening genres page.');
                break;
            case 'openSearch':
                router.push('/manga?search=true');
                speak('Opening search page.');
                break;
            case 'search':
                if (params?.query) {
                    router.push(`/manga?search=${encodeURIComponent(params.query)}`);
                    speak(`Searching for ${params.query}.`);
                }
                break;
            case 'openManga':
                if (params?.mangaName) {
                    openMangaByName(params.mangaName);
                }
                break;
            case 'startReadingCurrentManga':
                // Check if we're on a manga detail page before executing
                if (isOnMangaDetailPage()) {
                    startReadingCurrentManga();
                } else {
                    speak('Please navigate to a manga page first, or say "open [manga name]" to open a specific manga.');
                }
                break;
            case 'goToPage':
            case 'nextPage':
            case 'previousPage':
            case 'goToLastPage':
                // Dispatch to ChapterReader if on chapter page
                if (pathname?.includes('/chapter/')) {
                    window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { command: action, params } }));
                    speak(action === 'goToPage' ? `Going to page ${params?.pageNumber || ''}.` : 
                          action === 'nextPage' ? 'Going to next page.' :
                          action === 'previousPage' ? 'Going to previous page.' :
                          'Going to last page.');
                } else {
                    speak('Page navigation is only available on chapter reading pages.');
                }
                break;
            case 'scroll':
                // Handle scroll up/down commands
                // Try to extract direction from params first, then from transcript
                let direction = params?.direction;
                
                // If direction not in params, try to extract from the last transcript
                if (!direction && transcript) {
                    const lowerTranscript = transcript.toLowerCase();
                    if (lowerTranscript.includes('down') || lowerTranscript.includes('downward')) {
                        direction = 'down';
                    } else if (lowerTranscript.includes('up') || lowerTranscript.includes('upward')) {
                        direction = 'up';
                    }
                }
                
                if (direction) {
                    const scrollAmount = window.innerHeight * 0.8; // Scroll 80% of viewport height for better visibility
                    
                    if (direction === 'down') {
                        window.scrollBy({ 
                            top: scrollAmount, 
                            behavior: 'smooth' 
                        });
                        speak('Scrolling down.');
                    } else if (direction === 'up') {
                        window.scrollBy({ 
                            top: -scrollAmount, 
                            behavior: 'smooth' 
                        });
                        speak('Scrolling up.');
                    }
                } else {
                    // Fallback: try to scroll based on common patterns
                    const lowerTranscript = (transcript || '').toLowerCase();
                    if (lowerTranscript.includes('down')) {
                        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                        speak('Scrolling down.');
                    } else if (lowerTranscript.includes('up')) {
                        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                        speak('Scrolling up.');
                    } else {
                        speak('Please specify scroll direction: scroll up or scroll down.');
                    }
                }
                break;
            case 'searchByGenre':
                if (params?.genre) {
                    router.push(`/manga?genre=${encodeURIComponent(params.genre)}`);
                    speak(`Searching for ${params.genre} manga.`);
                }
                break;
            case 'showLatest':
                router.push('/manga?sort=latest');
                speak('Showing latest updates.');
                break;
            case 'showBookmarks':
                router.push('/library?tab=bookmarks');
                speak('Showing your bookmarks.');
                break;
            case 'lastRead':
                router.push('/library?tab=history');
                speak('Showing your reading history.');
                break;
            case 'continueReading':
                router.push('/library?tab=continue');
                speak('Opening continue reading.');
                break;
            case 'openProfile':
                if (!isAuthenticated) {
                    speak('Please log in to view your profile.');
                    router.push('/login');
                } else {
                    router.push('/profile');
                    speak('Opening your profile.');
                }
                break;
            case 'openSettings':
                if (!isAuthenticated) {
                    speak('Please log in to access settings.');
                    router.push('/login');
                } else {
                    router.push('/settings');
                    speak('Opening settings.');
                }
                break;
            case 'openStats':
                router.push('/stats');
                speak('Opening statistics.');
                break;
            case 'openNotifications':
                if (!isAuthenticated) {
                    speak('Please log in to view notifications.');
                    router.push('/login');
                } else {
                    router.push('/notifications');
                    speak('Opening notifications.');
                }
                break;
            case 'openCoins':
                if (!isAuthenticated) {
                    speak('Please log in to purchase coins.');
                    router.push('/login');
                } else {
                    router.push('/coins');
                    speak('Opening coins page.');
                }
                break;
            case 'openPricing':
                router.push('/pricing');
                speak('Opening pricing page.');
                break;
            case 'openCreatorDashboard':
                if (!isAuthenticated) {
                    speak('Please log in to access creator dashboard.');
                    router.push('/login');
                } else if (!user?.isCreator && user?.role !== 'admin') {
                    speak('You need to be a creator to access the creator dashboard. Say "become creator" to learn more.');
                    router.push('/become-creator');
                } else {
                    router.push('/creator/dashboard');
                    speak('Opening creator dashboard.');
                }
                break;
            case 'openAdminDashboard':
                if (!isAuthenticated) {
                    speak('Please log in to access admin dashboard.');
                    router.push('/login');
                } else if (user?.role !== 'admin') {
                    speak('You do not have permission to access the admin dashboard.');
                } else {
                    router.push('/admin/dashboard');
                    speak('Opening admin dashboard.');
                }
                break;
            case 'openUpload':
                if (!isAuthenticated) {
                    speak('Please log in to upload manga.');
                    router.push('/login');
                } else if (!user?.isCreator && user?.role !== 'admin') {
                    speak('You need to be a creator to upload manga. Say "become creator" to learn more.');
                    router.push('/become-creator');
                } else {
                    router.push('/upload');
                    speak('Opening upload page.');
                }
                break;
            case 'openBecomeCreator':
                router.push('/become-creator');
                speak('Opening become creator page.');
                break;
            case 'openLogin':
                if (isAuthenticated) {
                    speak('You are already logged in.');
                } else {
                    router.push('/login');
                    speak('Opening login page.');
                }
                break;
            case 'openSignup':
                if (isAuthenticated) {
                    speak('You are already logged in.');
                } else {
                    router.push('/signup');
                    speak('Opening sign up page.');
                }
                break;
            case 'openHelp':
                router.push('/help');
                speak('Opening help page.');
                break;
            case 'openAbout':
                router.push('/about');
                speak('Opening about page.');
                break;
            case 'openContact':
                router.push('/contact');
                speak('Opening contact page.');
                break;
            case 'openSynopsisTab':
                // Switch to synopsis tab on manga detail page
                if (isOnMangaDetailPage()) {
                    const synopsisTab = document.querySelector('[data-tab="synopsis"]') as HTMLElement;
                    if (synopsisTab) {
                        synopsisTab.click();
                        speak('Opening synopsis tab.');
                    } else {
                        // Try alternative selector
                        const allButtons = Array.from(document.querySelectorAll('button'));
                        const synopsisButton = allButtons.find(btn => 
                            btn.textContent?.toLowerCase().includes('synopsis') && 
                            !btn.textContent?.toLowerCase().includes('chapters') &&
                            !btn.textContent?.toLowerCase().includes('reviews')
                        );
                        if (synopsisButton) {
                            (synopsisButton as HTMLElement).click();
                            speak('Opening synopsis tab.');
                        } else {
                            speak('Could not find synopsis tab. Please try again.');
                        }
                    }
                } else {
                    speak('Synopsis tab is only available on manga detail pages.');
                }
                break;
            case 'openChaptersTab':
                // Switch to chapters tab on manga detail page
                if (isOnMangaDetailPage()) {
                    const chaptersTab = document.querySelector('[data-tab="chapters"]') as HTMLElement;
                    if (chaptersTab) {
                        chaptersTab.click();
                        speak('Opening chapters tab.');
                    } else {
                        // Try alternative selector - find button with "Chapters" text
                        const allButtons = Array.from(document.querySelectorAll('button'));
                        const chaptersButton = allButtons.find(btn => 
                            btn.textContent?.toLowerCase().includes('chapters') &&
                            !btn.textContent?.toLowerCase().includes('synopsis') &&
                            !btn.textContent?.toLowerCase().includes('reviews')
                        );
                        if (chaptersButton) {
                            (chaptersButton as HTMLElement).click();
                            speak('Opening chapters tab.');
                        } else {
                            speak('Could not find chapters tab. Please try again.');
                        }
                    }
                } else {
                    speak('Chapters tab is only available on manga detail pages.');
                }
                break;
            case 'openReviewsTab':
                // Switch to reviews tab on manga detail page
                if (isOnMangaDetailPage()) {
                    const reviewsTab = document.querySelector('[data-tab="reviews"]') as HTMLElement;
                    if (reviewsTab) {
                        reviewsTab.click();
                        speak('Opening reviews tab.');
                    } else {
                        // Try alternative selector - find button with "Reviews" text
                        const allButtons = Array.from(document.querySelectorAll('button'));
                        const reviewsButton = allButtons.find(btn => 
                            btn.textContent?.toLowerCase().includes('reviews') &&
                            !btn.textContent?.toLowerCase().includes('synopsis') &&
                            !btn.textContent?.toLowerCase().includes('chapters')
                        );
                        if (reviewsButton) {
                            (reviewsButton as HTMLElement).click();
                            speak('Opening reviews tab.');
                        } else {
                            speak('Could not find reviews tab. Please try again.');
                        }
                    }
                } else {
                    speak('Reviews tab is only available on manga detail pages.');
                }
                break;
            case 'openFirstVisibleChapter':
                // Open the first visible chapter from the chapters tab
                if (isOnMangaDetailPage()) {
                    // First, make sure we're on the chapters tab
                    const chaptersTab = document.querySelector('[data-tab="chapters"]') as HTMLElement;
                    if (chaptersTab) {
                        // Check if chapters tab is active by looking at its classes or computed styles
                        const isActive = chaptersTab.classList.contains('active') || 
                                        chaptersTab.style.borderBottomWidth === '2px' ||
                                        chaptersTab.getAttribute('aria-selected') === 'true';
                        if (!isActive) {
                            chaptersTab.click();
                            // Wait a bit for tab to switch
                            setTimeout(() => {
                                openFirstVisibleChapter();
                            }, 300);
                            return;
                        }
                    }
                    openFirstVisibleChapter();
                } else {
                    speak('Chapter navigation is only available on manga detail pages.');
                }
                break;
            case 'notifyNewChapter':
                speak('I will notify you when new chapters arrive. Make sure notifications are enabled in your settings.');
                break;
            case 'suggestComedy':
                router.push('/manga?genre=comedy&sort=popular');
                speak('Showing popular comedy manga.');
                break;
            case 'suggestAction':
                router.push('/manga?genre=action&sort=popular');
                speak('Showing popular action manga.');
                break;
            case 'showTrending':
                router.push('/manga?sort=trending');
                speak('Showing trending manga.');
                break;
            case 'suggestSimilar':
                if (params?.similarTo) {
                    router.push(`/manga?search=${encodeURIComponent(params.similarTo)}`);
                    speak(`Searching for manga similar to ${params.similarTo}.`);
                }
                break;
            case 'findShortManga':
                if (params?.maxChapters) {
                    router.push(`/manga?maxChapters=${params.maxChapters}`);
                    speak(`Finding manga with less than ${params.maxChapters} chapters.`);
                }
                break;
            case 'showTrendingRomance':
                router.push('/manga?genre=romance&sort=trending');
                speak('Showing trending romance manga.');
                break;
            case 'help':
                handleHelp();
                break;
            case 'helpBookmark':
                speak('To bookmark, say "bookmark this" while reading a chapter. To view bookmarks, say "show my bookmarks".');
                break;
            case 'helpDownload':
                speak('Download feature is coming soon. You can bookmark chapters to access them later.');
                break;
            case 'helpDarkMode':
                speak('Say "toggle theme" or "dark mode" to switch between light and dark themes.');
                break;
            case 'explainFeature':
                if (params?.feature) {
                    const feature = params.feature.toLowerCase();
                    if (feature.includes('eye')) {
                        speak('Eye tracking allows you to scroll by looking up or down. Enable it from the settings.');
                    } else if (feature.includes('brightness')) {
                        speak('Auto brightness adjusts your screen brightness based on ambient light. Enable it from the settings.');
                    } else if (feature.includes('voice')) {
                        speak('Voice assistant lets you control the website using voice commands. Say "help" to see all available commands.');
                    }
                }
                break;
            case 'clearHistory':
                speak('To clear reading history, please go to your library settings and confirm there.');
                break;
            case 'logout':
                speak('To logout, please use the logout button in your profile menu for security.');
                break;
            default:
                // Pass other commands to parent component (ChapterReader)
                onCommand?.(action, params);
                speak(`Executing ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        }
        
        // Clear transcript after processing
        setTimeout(() => {
            setTranscript('');
            setLastCommand(null);
        }, 2000);
    };

    const openMangaByName = async (mangaName: string) => {
        try {
            // Check if we're already on a manga detail page
            const currentPath = getCurrentPathname();
            const mangaDetailMatch = currentPath.match(/\/manga\/([^\/\?]+)/);
            
            if (mangaDetailMatch && isOnMangaDetailPage()) {
                // We're on a manga detail page - check if this is the same manga
                const currentMangaId = mangaDetailMatch[1];
                
                try {
                    // Fetch current manga to check title
                    const currentMangaResponse = await fetch(`/api/manga/${currentMangaId}`);
                    if (currentMangaResponse.ok) {
                        const currentMangaData = await currentMangaResponse.json();
                        const currentManga = currentMangaData.manga;
                        const currentTitle = (currentManga.title || '').toLowerCase();
                        const searchName = mangaName.toLowerCase();
                        
                        // Check if the manga name matches current manga (fuzzy match)
                        if (currentTitle.includes(searchName) || searchName.includes(currentTitle) || 
                            currentTitle === searchName) {
                            // Same manga - go to first chapter instead
                            speak(`Starting to read ${currentManga.title || mangaName}...`);
                            await startReadingCurrentManga();
                            return;
                        }
                    }
                } catch (error) {
                    // If we can't fetch current manga, proceed with search
                }
            }
            
            speak(`Searching for ${mangaName}...`);
            
            // Search for manga by name
            const response = await fetch(`/api/manga/search?q=${encodeURIComponent(mangaName)}&limit=1`);
            
            if (!response.ok) {
                speak(`Could not find ${mangaName}. Please try searching manually.`);
                router.push(`/manga?search=${encodeURIComponent(mangaName)}`);
                return;
            }
            
            const data = await response.json();
            const results = data.manga || data.results || [];
            
            if (results.length === 0) {
                speak(`No manga found with name ${mangaName}. Opening search page.`);
                router.push(`/manga?search=${encodeURIComponent(mangaName)}`);
                return;
            }
            
            // Get the first result
            const manga = results[0];
            const mangaId = manga._id || manga.id;
            
            if (!mangaId) {
                speak(`Found ${mangaName} but could not open it. Opening search page.`);
                router.push(`/manga?search=${encodeURIComponent(mangaName)}`);
                return;
            }
            
            // If we're already on this manga's page, go to first chapter instead
            if (mangaDetailMatch && mangaDetailMatch[1] === mangaId.toString()) {
                speak(`Starting to read ${manga.title || mangaName}...`);
                await startReadingCurrentManga();
                return;
            }
            
            // Navigate to manga detail page - use router.push to preserve Voice Assistant state
            const mangaUrl = `/manga/${mangaId}`;
            speak(`Opening ${manga.title || mangaName}.`);
            
            // Use router.push instead of window.location to preserve Voice Assistant state
            // Use setTimeout to ensure speech is heard before navigation
            setTimeout(() => {
                router.push(mangaUrl);
            }, 500);
        } catch (error) {
            speak(`Error searching for ${mangaName}. Opening search page.`);
            router.push(`/manga?search=${encodeURIComponent(mangaName)}`);
        }
    };

    const startReadingCurrentManga = async () => {
        // Check if we're on a manga detail page (more flexible check)
        if (!isOnMangaDetailPage()) {
            // Not on a manga detail page - try to find manga from current page
            speak('Please navigate to a manga page first, or say "open [manga name]" to open a specific manga.');
            return;
        }
        
        // Extract mangaId from pathname (use getCurrentPathname for reliability)
        const currentPath = getCurrentPathname();
        const mangaIdMatch = currentPath.match(/\/manga\/([^\/\?]+)/);
        if (!mangaIdMatch) {
            speak('Could not find manga ID. Please try navigating to the manga page again.');
            return;
        }
        
        const mangaId = mangaIdMatch[1];
        
        try {
            speak('Finding first chapter...');
            
            // Fetch manga details to get chapters
            const response = await fetch(`/api/manga/${mangaId}`);
            
            if (!response.ok) {
                speak('Could not load manga chapters. Please try clicking the read button manually.');
                return;
            }
            
            const data = await response.json();
            const manga = data.manga;
            const chapters = manga.chapters || [];
            
            if (chapters.length === 0) {
                speak('No chapters available for this manga.');
                return;
            }
            
            // Get the first chapter (sorted by chapterNumber)
            const sortedChapters = [...chapters].sort((a: any, b: any) => 
                (a.chapterNumber || 0) - (b.chapterNumber || 0)
            );
            const firstChapter = sortedChapters[0];
            const firstChapterId = firstChapter._id || firstChapter.id;
            
            if (!firstChapterId) {
                speak('Could not find first chapter. Please try clicking the read button manually.');
                return;
            }
            
            // Navigate to first chapter - use router.push to preserve Voice Assistant state
            const chapterUrl = `/manga/${mangaId}/chapter/${firstChapterId}`;
            speak(`Starting Chapter ${firstChapter.chapterNumber || 1}.`);
            
            // Use router.push instead of window.location to preserve Voice Assistant state
            // Use setTimeout to ensure speech is heard before navigation
            setTimeout(() => {
                router.push(chapterUrl);
            }, 800);
        } catch (error) {
            console.error('Error loading chapters:', error);
            speak('Error loading chapters. Please try clicking the read button manually.');
        }
    };

    const openFirstVisibleChapter = () => {
        // First, try to find and click the "Read Chapter 1" button (most reliable)
        const readButton = Array.from(document.querySelectorAll('button, a')).find(el => {
            const text = el.textContent?.toLowerCase() || '';
            return (text.includes('read chapter') || text.includes('chapter 1')) && 
                   !text.includes('chapters (');
        }) as HTMLElement;
        
        if (readButton) {
            const href = (readButton as HTMLAnchorElement).href;
            if (href && href.includes('/chapter/')) {
                // If it's a link, use router.push to preserve Voice Assistant state
                const path = new URL(href, window.location.origin).pathname;
                router.push(path);
            } else {
                // If it's a button, click it
                readButton.click();
            }
            speak('Opening chapter.');
            return;
        }
        
        // Fallback: Find chapter divs with onClick handlers (from MangaTabs.tsx)
        const chapterDivs = Array.from(document.querySelectorAll('div[onclick*="chapter"], div[class*="cursor-pointer"]'));
        
        // Filter to find actual chapter cards (they contain "Chapter" text)
        const chapterCards = chapterDivs.filter(div => {
            const text = div.textContent?.toLowerCase() || '';
            return text.includes('chapter') && 
                   !text.includes('chapters (') &&
                   !text.includes('synopsis') &&
                   !text.includes('reviews');
        });
        
        if (chapterCards.length > 0) {
            // Get the first visible chapter card
            const firstVisible = chapterCards.find(div => {
                const rect = div.getBoundingClientRect();
                return rect.top >= 0 && rect.top < window.innerHeight && rect.height > 0;
            }) as HTMLElement || (chapterCards[0] as HTMLElement);
            
            if (firstVisible) {
                firstVisible.click();
                speak('Opening chapter.');
                return;
            }
        }
        
        // Last resort: Try to extract chapter ID from the page and navigate directly
        const currentPath = getCurrentPathname();
        const mangaIdMatch = currentPath.match(/\/manga\/([^\/\?]+)/);
        if (mangaIdMatch) {
            const mangaId = mangaIdMatch[1];
            // Try to fetch chapters and open the first one
            fetch(`/api/manga/${mangaId}`)
                .then(res => res.json())
                .then(data => {
                    const chapters = data.manga?.chapters || [];
                    if (chapters.length > 0) {
                        const sortedChapters = [...chapters].sort((a: any, b: any) => 
                            (a.chapterNumber || 0) - (b.chapterNumber || 0)
                        );
                        const firstChapter = sortedChapters[0];
                        const firstChapterId = firstChapter._id || firstChapter.id;
                        if (firstChapterId) {
                            router.push(`/manga/${mangaId}/chapter/${firstChapterId}`);
                            speak('Opening chapter.');
                        } else {
                            speak('Could not find chapter. Please try clicking the read button manually.');
                        }
                    } else {
                        speak('No chapters available.');
                    }
                })
                .catch(() => {
                    speak('Could not load chapters. Please try clicking the read button manually.');
                });
        } else {
            speak('No visible chapters found. Please make sure you are on the chapters tab.');
        }
    };

    const speak = (text: string) => {
        if (synthRef.current) {
            // Cancel any ongoing speech
            synthRef.current.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            synthRef.current.speak(utterance);
        }
    };

    const toggleListening = () => {
        if (!isSupported) {
            setError('Voice recognition not supported');
            return;
        }

        if (!isAuthenticated) {
            setError('Please login to use voice assistant');
            return;
        }

        setIsListening(!isListening);
        if (!isListening) {
            speak('Voice assistant activated. Say "help" for available commands.');
        } else {
            speak('Voice assistant deactivated.');
        }
    };

    const handleHelp = () => {
        const helpText = `Available commands: Navigation - next page, previous page, go to chapter number, open library, open home, browse manga. 
        Search - search for manga name, find comedy manga, show latest updates. 
        Personal - show my bookmarks, continue reading, what did I read last. 
        Content - suggest comedy manga, show trending, recommend action manga. 
        Settings - toggle theme, zoom in, zoom out, brightness up, brightness down. 
        Help - how do I bookmark, how to switch to dark mode, explain features. 
        Say any command to use it.`;
        speak(helpText);
    };

    // CRITICAL: Lock position when isListening changes to prevent movement when activated
    // This useEffect must be declared before any conditional returns (Rules of Hooks)
    useEffect(() => {
        if (!panelRef.current) return;
        
        const el = panelRef.current;
        // Lock position immediately when isListening changes
        el.style.setProperty('position', 'fixed', 'important');
        el.style.setProperty('bottom', '7rem', 'important');
        el.style.setProperty('right', '1rem', 'important');
        el.style.setProperty('top', 'auto', 'important');
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('transform', 'none', 'important');
    }, [isListening]); // Run when isListening changes
    
    if (!showUI) {
        return null;
    }

    if (!isSupported) {
        return (
            <div className="text-xs text-gray-400 p-2">
                Voice assistant not supported in this browser
            </div>
        );
    }
    
    return (
        <div 
            ref={panelRef}
            className="fixed right-4 z-50"
            style={{
                position: 'fixed',
                bottom: '7rem', // Above AutoBrightness (1rem + ~120px height + 1rem gap = ~7rem)
                right: '1rem',
                top: 'auto',
                left: 'auto',
                transform: 'none',
                zIndex: 9999,
                width: 'auto' // Prevent width changes from affecting position
            }}
        >
            <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl p-4 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Voice Assistant</h3>
                    <button
                        onClick={toggleListening}
                        disabled={!enabled || !isAuthenticated}
                        className={`p-2 rounded-full transition-all ${
                            isListening
                                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                        } ${!enabled || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isListening ? 'Stop listening' : 'Start listening'}
                    >
                        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>
                </div>

                {error && (
                    <div className="text-xs text-red-400 mb-2 p-2 bg-red-900/20 rounded">
                        {error}
                    </div>
                )}

                {pendingConfirmation && (
                    <div className="text-xs text-yellow-400 mb-2 p-2 bg-yellow-900/20 rounded">
                        ⚠️ Waiting for confirmation: {pendingConfirmation.action}
                    </div>
                )}

                {isListening && (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Listening...</span>
                        </div>
                        {transcript && (
                            <div className="text-xs text-gray-300 mt-1 p-2 bg-slate-700/50 rounded">
                                "{transcript}"
                            </div>
                        )}
                        {lastCommand && (
                            <div className="text-xs text-green-400 mt-1">
                                ✓ Executed: {lastCommand}
                            </div>
                        )}
                    </div>
                )}

                {!isAuthenticated && (
                    <div className="text-xs text-yellow-400 mb-2">
                        Login required
                    </div>
                )}

                <button
                    onClick={handleHelp}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1"
                >
                    <FaVolumeUp />
                    <span>Help</span>
                </button>
            </div>
        </div>
    );
}
