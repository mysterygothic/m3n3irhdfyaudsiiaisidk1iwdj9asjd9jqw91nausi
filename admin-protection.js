// Admin Pages Protection - Security Layer
// This script MUST be loaded FIRST before any other script

(function() {
    'use strict';
    
    // Check if this is a protected admin page
    function isProtectedPage() {
        const path = window.location.pathname;
        const protectedPages = [
            'admin-dashboard.html',
            'admin-ramadan.html',
            'admin-delivery.html',
            'admin-driver-orders.html',
            'admin-customers.html',
            'admin-users.html',
            'admin-inventory.html',
            'admin-ai-assistant.html'
        ];
        
        return protectedPages.some(page => path.includes(page));
    }
    
    // Verify admin authentication
    async function verifyAuth() {
        const token = localStorage.getItem('admin_token');
        
        if (!token) {
            console.warn('🚫 Unauthorized access attempt blocked!');
            window.location.replace('admin.html');
            return false;
        }
        
        // Verify token format (must start with supabase_ and have valid structure)
        if (!token.startsWith('supabase_') || token.split('_').length < 4) {
            console.warn('🚫 Invalid token format!');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_user_data');
            window.location.replace('admin.html');
            return false;
        }
        
        // Server-side token verification
        try {
            if (window.SUPABASE_SECURE && window.SUPABASE_SECURE.auth) {
                const result = await window.SUPABASE_SECURE.auth.verify(token);
                if (!result.success || !result.valid) {
                    console.warn('🚫 Token verification failed!');
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_user');
                    localStorage.removeItem('admin_user_data');
                    window.location.replace('admin.html');
                    return false;
                }
            }
        } catch (error) {
            console.error('Token verification error:', error);
            // Continue in offline mode but log the error
        }
        
        return true;
    }
    
    // Initialize protection
    async function init() {
        if (!isProtectedPage()) {
            // Not a protected page, show content
            if (document.body) {
                document.body.style.removeProperty('display');
            }
            return;
        }
        
        // Verify authentication
        const isAuthenticated = await verifyAuth();
        if (isAuthenticated) {
            // Authenticated, show content
            if (document.body) {
                document.body.style.removeProperty('display');
            }
        } else {
            // Not authenticated, redirect to login
            // Keep body hidden during redirect
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }
})();

