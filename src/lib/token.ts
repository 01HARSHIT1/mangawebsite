/**
 * Utility functions for handling authentication tokens
 */

export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem('authToken');
};

export const setAuthToken = (token: string): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem('authToken', token);
};

export const removeAuthToken = (): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem('authToken');
};

export const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
    };
};
