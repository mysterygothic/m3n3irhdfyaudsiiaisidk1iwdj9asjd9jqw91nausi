/**
 * Cinematic Theme Switcher - Vanilla JavaScript Implementation
 * A beautiful, animated theme toggle with particle effects and smooth transitions
 * 
 * Features:
 * - Smooth spring-like animations
 * - Particle burst effects on toggle
 * - Deep neumorphic design with film grain texture
 * - LocalStorage persistence
 * - Accessible (ARIA labels, keyboard support)
 */

class CinematicThemeSwitcher {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    this.isDark = this.getInitialTheme();
    this.isAnimating = false;
    this.particles = [];
    
    this.init();
    this.applyTheme(false); // Apply initial theme without transition
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  getInitialTheme() {
    // Check both 'theme' and 'admin_theme' for compatibility
    const stored = localStorage.getItem('theme') || localStorage.getItem('admin_theme');
    if (stored) {
      return stored === 'dark';
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Initialize the theme switcher UI
   */
  init() {
    this.container.innerHTML = `
      <div class="cinematic-switcher-wrapper">
        <!-- SVG Filters for Film Grain -->
        <svg class="cinematic-switcher-svg-filters">
          <defs>
            <!-- Light mode grain -->
            <filter id="grain-light">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
              <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise"/>
              <feComponentTransfer in="desaturatedNoise" result="lightGrain">
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="lightGrain" mode="overlay"/>
            </filter>
            
            <!-- Dark mode grain -->
            <filter id="grain-dark">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
              <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise"/>
              <feComponentTransfer in="desaturatedNoise" result="darkGrain">
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="darkGrain" mode="overlay"/>
            </filter>
          </defs>
        </svg>

        <!-- Main Toggle Button -->
        <button 
          class="cinematic-switcher-button ${this.isDark ? 'dark' : 'light'}"
          aria-label="Switch to ${this.isDark ? 'light' : 'dark'} mode"
          role="switch"
          aria-checked="${this.isDark}"
        >
          <!-- Deep inner groove -->
          <div class="cinematic-switcher-groove"></div>
          
          <!-- Multi-layer glossy overlay -->
          <div class="cinematic-switcher-gloss"></div>
          
          <!-- Ambient occlusion -->
          <div class="cinematic-switcher-ambient"></div>

          <!-- Background Icons -->
          <div class="cinematic-switcher-bg-icons">
            <svg class="cinematic-icon sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <svg class="cinematic-icon moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>

          <!-- Circular Thumb -->
          <div class="cinematic-switcher-thumb">
            <!-- Glossy shine overlay -->
            <div class="cinematic-switcher-thumb-gloss"></div>
            
            <!-- Particle container -->
            <div class="cinematic-switcher-particles"></div>

            <!-- Active Icon -->
            <div class="cinematic-switcher-thumb-icon">
              <svg class="cinematic-icon sun-icon-active" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <svg class="cinematic-icon moon-icon-active" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </div>
          </div>
        </button>
      </div>
    `;

    // Attach event listeners
    this.button = this.container.querySelector('.cinematic-switcher-button');
    this.thumb = this.container.querySelector('.cinematic-switcher-thumb');
    this.particleContainer = this.container.querySelector('.cinematic-switcher-particles');
    
    this.button.addEventListener('click', () => this.toggle());
    
    // Keyboard support
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Toggle theme
   */
  toggle() {
    if (this.isAnimating) return;
    
    this.isDark = !this.isDark;
    this.generateParticles();
    this.applyTheme(true);
    
    // Save to localStorage (both keys for compatibility)
    const theme = this.isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    localStorage.setItem('admin_theme', theme); // For admin system compatibility
    
    // Update button attributes
    this.button.setAttribute('aria-label', `Switch to ${this.isDark ? 'light' : 'dark'} mode`);
    this.button.setAttribute('aria-checked', this.isDark);
  }

  /**
   * Apply theme to document and button
   */
  applyTheme(animate = true) {
    const root = document.documentElement;
    const body = document.body;
    
    if (this.isDark) {
      this.button.classList.remove('light');
      this.button.classList.add('dark');
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      body.classList.add('dark-mode'); // For compatibility with existing admin styles
      body.classList.remove('light-mode');
    } else {
      this.button.classList.remove('dark');
      this.button.classList.add('light');
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      body.classList.add('light-mode');
      body.classList.remove('dark-mode'); // For compatibility with existing admin styles
    }

    // Add transition class if animating
    if (animate) {
      this.button.classList.add('transitioning');
      setTimeout(() => {
        this.button.classList.remove('transitioning');
      }, 600);
    }
  }

  /**
   * Generate particle burst effect
   */
  generateParticles() {
    this.isAnimating = true;
    const particleCount = 3;
    
    // Clear existing particles
    this.particleContainer.innerHTML = '';
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'cinematic-particle';
      particle.style.animationDelay = `${i * 0.1}s`;
      particle.style.animationDuration = `${0.6 + i * 0.1}s`;
      
      // Add grain texture overlay
      const grain = document.createElement('div');
      grain.className = 'cinematic-particle-grain';
      particle.appendChild(grain);
      
      this.particleContainer.appendChild(particle);
    }
    
    // Clear particles after animation
    setTimeout(() => {
      this.particleContainer.innerHTML = '';
      this.isAnimating = false;
    }, 1000);
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.isDark ? 'dark' : 'light';
  }

  /**
   * Set theme programmatically
   */
  setTheme(theme) {
    const newIsDark = theme === 'dark';
    if (newIsDark !== this.isDark) {
      this.toggle();
    }
  }
}

// Auto-initialize if data-cinematic-theme attribute exists
document.addEventListener('DOMContentLoaded', () => {
  const autoInit = document.querySelector('[data-cinematic-theme]');
  if (autoInit) {
    const id = autoInit.id || 'cinematic-theme-switcher';
    autoInit.id = id;
    window.cinematicThemeSwitcher = new CinematicThemeSwitcher(id);
  }
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CinematicThemeSwitcher;
}
