'use client';

import { useState, useEffect, useRef } from 'react';
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
}

export default function VoiceAssistant({ onCommand, enabled = false, showUI = true }: VoiceAssistantProps) {
    const { isAuthenticated } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    
    // CRITICAL: Panel ref for position locking - must be declared before any conditional returns
    const panelRef = useRef<HTMLDivElement>(null);

    // Enhanced voice command patterns with better recognition
    const commands: VoiceCommand[] = [
        // Navigation commands
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
            pattern: /go\s+to\s+(chapter|episode|page)\s+(\d+)/i,
            action: 'goToChapter',
            params: (matches) => ({ chapterNumber: parseInt(matches[2]) })
        },
        {
            pattern: /go\s+to\s+page\s+(\d+)/i,
            action: 'goToPage',
            params: (matches) => ({ pageNumber: parseInt(matches[1]) })
        },
        {
            pattern: /(dark\s+mode|light\s+mode|toggle\s+theme)/i,
            action: 'toggleTheme'
        },
        {
            pattern: /(zoom\s+in|zoom\s+out|increase\s+zoom|decrease\s+zoom)/i,
            action: 'zoom',
            params: (matches) => ({ direction: matches[0].toLowerCase().includes('in') || matches[0].toLowerCase().includes('increase') ? 'in' : 'out' })
        },
        {
            pattern: /(play|pause|resume)/i,
            action: 'toggleAutoplay'
        },
        {
            pattern: /(scroll\s+down|scroll\s+up)/i,
            action: 'scroll',
            params: (matches) => ({ direction: matches[0].toLowerCase().includes('down') ? 'down' : 'up' })
        },
        {
            pattern: /(like|unlike)/i,
            action: 'toggleLike'
        },
        {
            pattern: /(share|share\s+this)/i,
            action: 'share'
        },
        {
            pattern: /(close|exit|stop)/i,
            action: 'close'
        },
        {
            pattern: /(help|what\s+can\s+you\s+do|commands)/i,
            action: 'help'
        },
        // Bookmark commands
        {
            pattern: /(bookmark|save|mark)\s+(this|current|page|chapter)?/i,
            action: 'bookmark'
        },
        {
            pattern: /(remove|delete|unbookmark)\s+bookmark/i,
            action: 'removeBookmark'
        },
        // Search commands
        {
            pattern: /(search|find)\s+(for\s+)?(.+)/i,
            action: 'search',
            params: (matches) => ({ query: matches[3] })
        },
        // Reading mode commands
        {
            pattern: /(fullscreen|full\s+screen|enter\s+fullscreen)/i,
            action: 'fullscreen'
        },
        {
            pattern: /(exit\s+fullscreen|leave\s+fullscreen)/i,
            action: 'exitFullscreen'
        },
        // Speed control
        {
            pattern: /(faster|speed\s+up|increase\s+speed)/i,
            action: 'increaseSpeed'
        },
        {
            pattern: /(slower|slow\s+down|decrease\s+speed)/i,
            action: 'decreaseSpeed'
        },
        // Manga-specific commands
        {
            pattern: /(read|start\s+reading|begin\s+reading)/i,
            action: 'startReading'
        },
        {
            pattern: /(pause\s+reading|stop\s+reading|take\s+a\s+break)/i,
            action: 'pauseReading'
        },
        {
            pattern: /(bookmark\s+here|save\s+position|remember\s+this)/i,
            action: 'bookmark'
        },
        {
            pattern: /(what\s+chapter|current\s+chapter|which\s+chapter)/i,
            action: 'currentChapter'
        },
        {
            pattern: /(go\s+to\s+manga|open\s+manga|show\s+manga)/i,
            action: 'goToManga'
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
            pattern: /(toggle\s+eye\s+tracking|enable\s+eye\s+tracking|disable\s+eye\s+tracking)/i,
            action: 'toggleEyeTracking'
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

        if (isListening) {
            startListening();
        } else {
            stopListening();
        }

        return () => {
            stopListening();
        };
    }, [enabled, isListening, isSupported, isAuthenticated]);

    const startListening = () => {
        if (!isSupported) {
            setError('Voice recognition not supported in this browser');
            return;
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
                // Silently handle errors to prevent console spam
                if (event.error === 'no-speech') {
                    // Restart listening if no speech detected
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
                // Restart if still listening
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
            // Silently handle errors
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
        for (const command of commands) {
            const matches = text.match(command.pattern);
            if (matches) {
                const action = command.action;
                const params = command.params ? command.params(matches) : undefined;
                
                setLastCommand(action);
                onCommand?.(action, params);
                
                // Provide audio feedback
                speak(`Executing ${action}`);
                
                // Clear transcript after processing
                setTimeout(() => {
                    setTranscript('');
                    setLastCommand(null);
                }, 2000);
                
                return;
            }
        }

        // No command matched
        speak("I didn't understand that command. Say 'help' for available commands.");
    };

    const speak = (text: string) => {
        if (synthRef.current) {
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
    };

    const handleHelp = () => {
        const helpText = "Available commands: next page, previous page, bookmark this, go to chapter number, toggle theme, zoom in, zoom out, like, share, and more. Say 'help' anytime for this list.";
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

