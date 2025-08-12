"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
    id: string;
    nickname: string;
    email: string;
    role: 'admin' | 'creator' | 'viewer';
    isVerified: boolean;
    bio?: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize authentication state
    const initializeAuth = useCallback(async () => {
        console.log('AuthContext: Initializing authentication...');

        // In development, optionally clear authentication for testing
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const shouldClearAuth = sessionStorage.getItem('clearAuthOnStart');
            if (!shouldClearAuth) {
                console.log('AuthContext: Development mode - clearing authentication for fresh start');
                localStorage.removeItem("token");
                sessionStorage.setItem('clearAuthOnStart', 'true');
            }
        }

        const token = localStorage.getItem("token");
        console.log('AuthContext: Token found:', token ? 'YES' : 'NO');

        if (!token) {
            console.log('AuthContext: No token found, setting as not authenticated');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        try {
            console.log('AuthContext: Validating token...');
            const response = await fetch(`/api/profile?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('AuthContext: Profile response status:', response.status);

            if (!response.ok) {
                throw new Error(`Profile fetch failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('AuthContext: Profile response data:', {
                user: data.user,
                bio: data.user?.bio,
                avatarUrl: data.user?.avatarUrl,
                hasBio: !!data.user?.bio,
                hasAvatar: !!data.user?.avatarUrl,
                timestamp: new Date().toISOString()
            });

            if (data.user) {
                console.log('AuthContext: Valid user found, setting authenticated state');
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                console.log('AuthContext: No valid user data, clearing authentication');
                localStorage.removeItem("token");
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('AuthContext: Error validating token:', error);
            localStorage.removeItem("token");
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            console.log('AuthContext: Initialization complete');
            setLoading(false);
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = useCallback((token: string, userData: User) => {
        try {
            console.log('AuthContext: Login called with:', {
                token: token && typeof token === 'string' ? token.substring(0, 20) + '...' : 'undefined or invalid',
                userData: userData || 'undefined',
                timestamp: new Date().toISOString()
            });

            if (!token || typeof token !== 'string') {
                console.error('AuthContext: Login called with invalid token:', token);
                return;
            }

            if (!userData) {
                console.error('AuthContext: Login called with invalid userData:', userData);
                return;
            }

            // Set token first
            localStorage.setItem("token", token);
            console.log('AuthContext: Token saved to localStorage');

            // Update state synchronously
            setUser(userData);
            setIsAuthenticated(true);
            console.log('AuthContext: User state set to:', userData);
            console.log('AuthContext: Authentication state set to true');
            console.log('AuthContext: State update completed at:', new Date().toISOString());

        } catch (error) {
            console.error('AuthContext: Error in login function:', error);
        }
    }, []);

    const logout = useCallback(() => {
        console.log('AuthContext: Logout called');
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
        console.log('AuthContext: User state cleared');
        console.log('AuthContext: Authentication state set to false');
        window.location.href = "/";
    }, []);

    const updateUser = useCallback((userData: Partial<User>) => {
        if (user) {
            console.log('AuthContext: Updating user data:', userData);
            setUser({ ...user, ...userData });
        }
    }, [user]);

    const refreshUser = useCallback(async () => {
        console.log('AuthContext: Force refreshing user data...');
        const token = localStorage.getItem("token");
        if (!token) {
            console.log('AuthContext: No token found for refresh');
            return;
        }

        try {
            const response = await fetch(`/api/profile?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('AuthContext: Refresh successful:', {
                    bio: data.user?.bio,
                    avatarUrl: data.user?.avatarUrl,
                    hasBio: !!data.user?.bio,
                    hasAvatar: !!data.user?.avatarUrl
                });

                if (data.user) {
                    setUser(data.user);
                    setIsAuthenticated(true);
                }
            } else {
                console.error('AuthContext: Refresh failed:', response.status);
            }
        } catch (error) {
            console.error('AuthContext: Error refreshing user:', error);
        }
    }, []);

    // Debug logging for state changes
    useEffect(() => {
        console.log('AuthContext: User state changed to:', user);
        console.log('AuthContext: Authentication state changed to:', isAuthenticated);
    }, [user, isAuthenticated]);

    console.log('AuthContext: Rendering with user:', user, 'loading:', loading, 'isAuthenticated:', isAuthenticated);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            updateUser,
            isAuthenticated,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 