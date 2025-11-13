/**
 * Tabler Theme Switcher
 * Handles dark/light mode switching with localStorage persistence
 */

(function() {
    'use strict';
    
    const THEME_KEY = 'admin-theme-preference';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';
    
    /**
     * Get the current theme from localStorage or system preference
     */
    function getTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) {
            return stored;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEME_DARK;
        }
        
        return THEME_LIGHT;
    }
    
    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        
        // Update toggle button if it exists
        updateToggleButton(theme);
    }
    
    /**
     * Toggle between dark and light themes
     */
    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        applyTheme(newTheme);
    }
    
    /**
     * Update the toggle button appearance
     */
    function updateToggleButton(theme) {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;
        
        if (theme === THEME_DARK) {
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span>وضع النهار</span>
            `;
            toggleBtn.setAttribute('aria-label', 'Switch to light mode');
            toggleBtn.setAttribute('title', 'Switch to light mode');
        } else {
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <span>وضع الليل</span>
            `;
            toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
            toggleBtn.setAttribute('title', 'Switch to dark mode');
        }
    }
    
    /**
     * Create and inject theme toggle button
     */
    function createToggleButton() {
        // Check if button already exists
        if (document.getElementById('theme-toggle-btn')) {
            return;
        }
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle-btn';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        toggleBtn.onclick = toggleTheme;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .theme-toggle-btn {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                cursor: pointer;
                font-family: var(--font-sans);
                font-size: var(--font-size-sm);
                font-weight: 500;
                box-shadow: var(--shadow-md);
                transition: all var(--transition-fast);
            }
            
            .theme-toggle-btn:hover {
                background: var(--bg-secondary);
                box-shadow: var(--shadow-lg);
                transform: translateY(-2px);
            }
            
            .theme-toggle-btn svg {
                flex-shrink: 0;
            }
            
            .theme-toggle-btn span {
                white-space: nowrap;
            }
            
            @media (max-width: 768px) {
                .theme-toggle-btn {
                    top: 10px;
                    left: 10px;
                    padding: 8px 12px;
                    font-size: 12px;
                }
                
                .theme-toggle-btn span {
                    display: none;
                }
            }
        `;
        
        // Inject button and styles
        document.head.appendChild(style);
        document.body.appendChild(toggleBtn);
        
        // Update button appearance
        updateToggleButton(getTheme());
    }
    
    /**
     * Initialize theme system
     */
    function init() {
        // Remove preload class to enable transitions
        document.documentElement.classList.add('preload');
        
        // Apply saved theme immediately (before page renders)
        const theme = getTheme();
        applyTheme(theme);
        
        // Remove preload class after a brief delay
        setTimeout(() => {
            document.documentElement.classList.remove('preload');
        }, 100);
        
        // Create toggle button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createToggleButton);
        } else {
            createToggleButton();
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't set a preference
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
                }
            });
        }
    }
    
    // Initialize immediately
    init();
    
    // Expose API for external use
    window.TablerTheme = {
        toggle: toggleTheme,
        set: applyTheme,
        get: getTheme,
        DARK: THEME_DARK,
        LIGHT: THEME_LIGHT
    };
})();
