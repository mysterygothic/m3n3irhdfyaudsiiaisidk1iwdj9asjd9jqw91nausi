// ========================================
//  MOBILE SUPPORT & DARK MODE
// ========================================

(function() {
    'use strict';
    
    // ==================== THEME MANAGEMENT ====================
    const THEME_KEY = 'admin_theme';
    
    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'light';
    }
    
    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
    }
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    // Apply saved theme immediately
    applyTheme(getTheme());
    
    // ==================== DOM INITIALIZATION ====================
    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
        // Theme toggle is now handled by cinematic-theme-switcher.js
    });
    
    // ==================== MOBILE MENU ====================
    function initMobileMenu() {
        const sidebar = document.querySelector('.admin-sidebar');
        if (!sidebar) return;
        
        // Create mobile menu toggle button
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '☰';
        menuToggle.setAttribute('aria-label', 'فتح القائمة');
        document.body.appendChild(menuToggle);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
        
        // Toggle menu
        menuToggle.addEventListener('click', function() {
            const isOpen = sidebar.classList.contains('open');
            
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', closeMobileMenu);
        
        // Close menu when clicking a nav link
        const navLinks = sidebar.querySelectorAll('.admin-nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Only close on mobile
                if (window.innerWidth <= 768) {
                    setTimeout(closeMobileMenu, 300);
                }
            });
        });
        
        // Close menu on window resize if going to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        });
        
        function openMobileMenu() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            menuToggle.innerHTML = '✕';
            menuToggle.setAttribute('aria-label', 'إغلاق القائمة');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            menuToggle.innerHTML = '☰';
            menuToggle.setAttribute('aria-label', 'فتح القائمة');
            document.body.style.overflow = '';
        }
    }
    
    // ==================== THEME TOGGLE ====================
    // Theme toggle is now handled by cinematic-theme-switcher.js
    // This section is kept for backward compatibility with theme storage
    
    // ==================== UTILITIES ====================
    
    // Export functions for external use
    window.AdminMobile = {
        getTheme: getTheme,
        setTheme: setTheme
    };
    
})();

