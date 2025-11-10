// Admin Permissions System
// Manages user roles and page access control

(function() {
    'use strict';
    
    // Define page permissions based on roles
    const PAGE_PERMISSIONS = {
        'admin': [
            'admin-ramadan.html',
            'admin-delivery.html',
            'admin-driver-orders.html',
            'admin-ai-assistant.html'
        ],
        'super_admin': [
            'admin-dashboard.html',
            'admin-ramadan.html',
            'admin-delivery.html',
            'admin-driver-orders.html',
            'admin-customers.html',
            'admin-inventory.html',
            'admin-users.html',
            'admin-ai-assistant.html'
        ]
    };
    
    // Get current user info from localStorage
    function getCurrentUser() {
        const userDataStr = localStorage.getItem('admin_user_data');
        if (!userDataStr) {
            console.warn('⚠️ No admin_user_data found in localStorage');
            return null;
        }
        
        try {
            const userData = JSON.parse(userDataStr);
            console.log('👤 Current user:', userData);
            return userData;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    
    // Check if user has access to current page
    function hasPageAccess() {
        const user = getCurrentUser();
        if (!user) return false;
        
        const currentPage = window.location.pathname.split('/').pop();
        const userRole = user.role || 'admin';
        const allowedPages = PAGE_PERMISSIONS[userRole] || [];
        
        return allowedPages.some(page => currentPage.includes(page));
    }
    
    // Filter sidebar navigation based on user role
    function filterSidebarNavigation() {
        const user = getCurrentUser();
        if (!user) return;
        
        const userRole = user.role || 'admin';
        const allowedPages = PAGE_PERMISSIONS[userRole] || [];
        
        // Get all nav items
        const navItems = document.querySelectorAll('.admin-nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            
            // Skip logout and AI assistant links
            if (!href || href === '#' || href.includes('javascript:')) {
                return;
            }
            
            // Check if this page is allowed for user's role
            const isAllowed = allowedPages.some(page => href.includes(page));
            
            if (!isAllowed) {
                item.style.display = 'none';
            }
        });
    }
    
    // Redirect to appropriate page based on role
    function redirectToAllowedPage() {
        const user = getCurrentUser();
        if (!user) {
            window.location.replace('admin.html');
            return;
        }
        
        const userRole = user.role || 'admin';
        const allowedPages = PAGE_PERMISSIONS[userRole] || [];
        
        if (allowedPages.length > 0) {
            window.location.replace(allowedPages[0]);
        } else {
            window.location.replace('admin.html');
        }
    }
    
    // Check page access and redirect if unauthorized
    function checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop();
        
        console.log('🔍 Checking page access for:', currentPage);
        
        // Skip check for login page
        if (currentPage.includes('admin.html') && !currentPage.includes('admin-')) {
            console.log('✅ Login page - skipping access check');
            return;
        }
        
        const user = getCurrentUser();
        console.log('👤 User data:', user);
        
        if (!user) {
            console.warn('🚫 No user data found - redirecting to login');
            window.location.replace('admin.html');
            return;
        }
        
        const userRole = user.role || 'admin';
        const allowedPages = PAGE_PERMISSIONS[userRole] || [];
        console.log('🔑 User role:', userRole);
        console.log('📋 Allowed pages:', allowedPages);
        
        if (!hasPageAccess()) {
            console.warn('🚫 Access denied to this page!');
            alert('⚠️ ليس لديك صلاحية للوصول إلى هذه الصفحة');
            redirectToAllowedPage();
        } else {
            console.log('✅ Access granted to this page');
        }
    }
    
    // Get user role display name
    function getUserRoleDisplay() {
        const user = getCurrentUser();
        if (!user) return '';
        
        return user.role === 'super_admin' ? 'مدير عام' : 'مشرف';
    }
    
    // Initialize permissions system
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                checkPageAccess();
                filterSidebarNavigation();
            });
        } else {
            checkPageAccess();
            filterSidebarNavigation();
        }
    }
    
    // Export functions to window
    window.AdminPermissions = {
        getCurrentUser,
        hasPageAccess,
        filterSidebarNavigation,
        redirectToAllowedPage,
        getUserRoleDisplay,
        PAGE_PERMISSIONS
    };
    
    // Auto-initialize
    init();
})();
