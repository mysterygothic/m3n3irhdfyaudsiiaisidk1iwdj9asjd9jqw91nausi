/**
 * Simple Theme Toggle - Lightweight version
 * No animations, no particles, minimal GPU usage
 */

// Apply theme immediately (before page renders)
(function() {
  const theme = localStorage.getItem('theme') || localStorage.getItem('admin_theme') || 'dark';
  const root = document.documentElement;
  const body = document.body;
  
  if (theme === 'dark') {
    root.classList.add('dark-theme');
    body.classList.add('dark-mode');
  } else {
    root.classList.add('light-theme');
    body.classList.add('light-mode');
  }
})();

// Initialize theme toggle when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('[data-theme-toggle]');
  if (!container) return;
  
  const currentTheme = localStorage.getItem('theme') || localStorage.getItem('admin_theme') || 'dark';
  const isDark = currentTheme === 'dark';
  
  // Create simple toggle button
  container.innerHTML = `
    <button class="simple-theme-toggle" aria-label="Toggle theme" title="Toggle theme">
      <span class="theme-icon">${isDark ? '🌙' : '☀️'}</span>
    </button>
  `;
  
  const button = container.querySelector('.simple-theme-toggle');
  
  // Toggle theme on click
  button.addEventListener('click', function() {
    const root = document.documentElement;
    const body = document.body;
    const icon = button.querySelector('.theme-icon');
    
    const isCurrentlyDark = body.classList.contains('dark-mode');
    const newTheme = isCurrentlyDark ? 'light' : 'dark';
    
    // Update classes
    if (isCurrentlyDark) {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
      icon.textContent = '☀️';
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      icon.textContent = '🌙';
    }
    
    // Force browser to recalculate styles
    void root.offsetHeight;
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('admin_theme', newTheme);
  });
});
