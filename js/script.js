// =====================================
// GLOBAL VARIABLES & CONFIGURATION
// =====================================

let deferredPrompt;
let player;
let isPlayerReady = false;

// Configuration
const CONFIG = {
  YOUTUBE_API_KEY: 'YOUR_API_KEY', // Optional: for advanced features
  INSTALL_PROMPT_DELAY: 3000, // 3 seconds
  THEME_STORAGE_KEY: 'darkkokan-theme',
  PWA_DISMISSED_KEY: 'darkkokan-pwa-dismissed',
  YOUTUBE_CHANNEL_URL: 'https://www.youtube.com/@darkkokan'
};

// =====================================
// DOM ELEMENTS
// =====================================

const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.querySelector('.theme-icon'),
  installPopup: document.getElementById('install-popup'),
  installBtn: document.getElementById('install-btn'),
  cancelInstall: document.getElementById('cancel-install'),
  videoModal: document.getElementById('video-modal'),
  modalClose: document.querySelector('.modal-close'),
  videoCards: document.querySelectorAll('.video-card'),
  watchNowBtns: document.querySelectorAll('.watch-now'),
  subscribeBtn: document.querySelector('.subscribe-btn')
};

// =====================================
// THEME MANAGEMENT
// =====================================

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme();
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.updateThemeIcon();
    this.bindEvents();
  }

  getStoredTheme() {
    const stored = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
    if (stored) return stored;
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem(CONFIG.THEME_STORAGE_KEY, theme);
  }

  updateThemeIcon() {
    if (elements.themeIcon) {
      elements.themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.updateThemeIcon();
    
    // Smooth transition effect
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  bindEvents() {
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(CONFIG.THEME_STORAGE_KEY)) {
        this.applyTheme(e.matches ? 'dark' : 'light');
        this.updateThemeIcon();
      }
    });
  }
}

// =====================================
// PWA INSTALLATION MANAGER (iOS Fixed)
// =====================================

class PWAManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.showInstallPrompt();
  }

  bindEvents() {
    // Listen for PWA install prompt (Android/Desktop only)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallPopup();
    });

    // Install button click
    if (elements.installBtn) {
      elements.installBtn.addEventListener('click', () => this.installPWA());
    }

    // Cancel install
    if (elements.cancelInstall) {
      elements.cancelInstall.addEventListener('click', () => this.dismissInstallPopup());
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.hideInstallPopup();
      deferredPrompt = null;
    });
  }

  showInstallPrompt() {
    // Show install popup after delay if not dismissed and not installed
    setTimeout(() => {
      if (!this.isPWADismissed() && !this.isPWAInstalled()) {
        this.showInstallPopup();
      }
    }, CONFIG.INSTALL_PROMPT_DELAY);
  }

  showInstallPopup() {
    if (elements.installPopup && !this.isPWADismissed()) {
      // Update button text and popup content based on device
      this.updatePopupForDevice();
      
      elements.installPopup.classList.remove('hidden');
      elements.installPopup.classList.add('show');
      
      // Add animation
      setTimeout(() => {
        elements.installPopup.style.transform = 'translateY(0)';
      }, 100);
    }
  }

  updatePopupForDevice() {
    const isIOS = this.isIOSDevice();
    const isStandalone = this.isPWAInstalled();
    
    if (isStandalone) return; // Don't show if already installed
    
    const popupTitle = elements.installPopup.querySelector('h3');
    const popupText = elements.installPopup.querySelector('p');
    const installButton = elements.installBtn;
    
    if (isIOS) {
      // iOS-specific instructions
      popupTitle.textContent = 'Add to Home Screen';
      popupText.innerHTML = `Tap the <strong>Share</strong> button and select "Add to Home Screen"`;
      installButton.textContent = 'Got it!';
      installButton.style.background = 'var(--success-color)';
    } else {
      // Android/Desktop instructions
      popupTitle.textContent = 'Install Dark Kokan App';
      popupText.textContent = 'Install Dark Kokan for the best mobile experience';
      installButton.textContent = 'Install App';
      installButton.style.background = 'var(--accent-gradient)';
    }
  }

  async installPWA() {
    const isIOS = this.isIOSDevice();
    
    if (isIOS) {
      // For iOS, just dismiss the popup since we showed instructions
      this.dismissInstallPopup();
      return;
    }

    // For Android/Desktop, use the native prompt
    if (!deferredPrompt) {
      this.dismissInstallPopup();
      return;
    }

    try {
      const result = await deferredPrompt.prompt();
      console.log('PWA install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        console.log('User accepted PWA installation');
        Analytics.trackPWAInstall();
      } else {
        console.log('User dismissed PWA installation');
      }
    } catch (error) {
      console.error('PWA installation error:', error);
    }

    this.hideInstallPopup();
    deferredPrompt = null;
  }

  hideInstallPopup() {
    if (elements.installPopup) {
      elements.installPopup.classList.remove('show');
      elements.installPopup.style.transform = 'translateY(100%)';
      
      setTimeout(() => {
        elements.installPopup.classList.add('hidden');
      }, 300);
    }
  }

  dismissInstallPopup() {
    localStorage.setItem(CONFIG.PWA_DISMISSED_KEY, 'true');
    this.hideInstallPopup();
  }

  isPWADismissed() {
    return localStorage.getItem(CONFIG.PWA_DISMISSED_KEY) === 'true';
  }

  isPWAInstalled() {
    // Check for standalone mode (PWA installed)
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  isAndroidDevice() {
    return /Android/.test(navigator.userAgent);
  }
}


// =====================================
// YOUTUBE PLAYER MANAGER
// =====================================

class YouTubePlayerManager {
  constructor() {
    this.currentVideoId = null;
    this.init();
  }

  init() {
    // YouTube API will call this function when ready
    window.onYouTubeIframeAPIReady = () => {
      isPlayerReady = true;
      console.log('YouTube Player API ready');
    };

    this.bindEvents();
  }

  bindEvents() {
    // Modal close events
    if (elements.modalClose) {
      elements.modalClose.addEventListener('click', () => this.closeModal());
    }

    // Close modal on outside click
    if (elements.videoModal) {
      elements.videoModal.addEventListener('click', (e) => {
        if (e.target === elements.videoModal) {
          this.closeModal();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });

    // Watch now buttons
    elements.watchNowBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = btn.getAttribute('data-video-id');
        this.openVideo(videoId);
      });
    });

    // Video card clicks
    elements.videoCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
        
        const videoId = card.getAttribute('data-video-id');
        this.openVideo(videoId);
      });

      // Add keyboard support for cards
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const videoId = card.getAttribute('data-video-id');
          this.openVideo(videoId);
        }
      });

      // Make cards focusable
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Play video: ${card.querySelector('.video-title').textContent}`);
    });
  }

  async openVideo(videoId) {
    if (!videoId) return;

    this.currentVideoId = videoId;
    this.openModal();

    // Wait for API to be ready
    if (!isPlayerReady) {
      await this.waitForYouTubeAPI();
    }

    this.createPlayer(videoId);
  }

  createPlayer(videoId) {
    // Destroy existing player
    if (player) {
      player.destroy();
    }

    // Create new player
    player = new YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
        autohide: 0
      },
      events: {
        onReady: (event) => {
          console.log('Player ready for video:', videoId);
        },
        onStateChange: (event) => {
          this.handlePlayerStateChange(event);
        },
        onError: (event) => {
          console.error('YouTube player error:', event.data);
          this.handlePlayerError();
        }
      }
    });
  }

  handlePlayerStateChange(event) {
    // Handle player state changes if needed
    const states = {
      '-1': 'unstarted',
      '0': 'ended',
      '1': 'playing',
      '2': 'paused',
      '3': 'buffering',
      '5': 'cued'
    };
    
    console.log('Player state:', states[event.data] || event.data);
  }

  handlePlayerError() {
    // Show error message and fallback to YouTube
    const videoUrl = `https://www.youtube.com/watch?v=${this.currentVideoId}`;
    window.open(videoUrl, '_blank');
    this.closeModal();
  }

  openModal() {
    if (elements.videoModal) {
      elements.videoModal.classList.remove('hidden');
      elements.videoModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus management
      elements.modalClose.focus();
    }
  }

  closeModal() {
    if (elements.videoModal) {
      elements.videoModal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Stop video
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
      
      setTimeout(() => {
        elements.videoModal.classList.add('hidden');
        if (player) {
          player.destroy();
          player = null;
        }
      }, 300);
    }
  }

  isModalOpen() {
    return elements.videoModal && elements.videoModal.classList.contains('active');
  }

  waitForYouTubeAPI() {
    return new Promise((resolve) => {
      const checkAPI = () => {
        if (window.YT && window.YT.Player) {
          isPlayerReady = true;
          resolve();
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      checkAPI();
    });
  }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

class Utils {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static isOnline() {
    return navigator.onLine;
  }

  static isMobile() {
    return window.innerWidth <= 768;
  }

  static getVideoThumbnail(videoId, quality = 'maxresdefault') {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }

  static openYouTubeApp(videoId) {
    const youtubeAppUrl = `vnd.youtube://${videoId}`;
    const youtubeWebUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Try to open YouTube app first
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = youtubeAppUrl;
    document.body.appendChild(iframe);
    
    // Fallback to web after short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.open(youtubeWebUrl, '_blank');
    }, 1000);
  }
}

// =====================================
// ANALYTICS & TRACKING
// =====================================

class Analytics {
  static trackEvent(eventName, eventData = {}) {
    // Google Analytics 4 example
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }
    
    console.log('Analytics Event:', eventName, eventData);
  }

  static trackVideoPlay(videoId, title) {
    this.trackEvent('video_play', {
      video_id: videoId,
      video_title: title,
      content_type: 'video'
    });
  }

  static trackSubscribeClick() {
    this.trackEvent('subscribe_click', {
      source: 'header_button'
    });
  }

  static trackPWAInstall() {
    this.trackEvent('pwa_install', {
      source: 'install_popup'
    });
  }

  static trackThemeChange(theme) {
    this.trackEvent('theme_change', {
      theme: theme
    });
  }
}

// =====================================
// PERFORMANCE MONITORING
// =====================================

class Performance {
  static init() {
    // Monitor loading performance
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log('Page load time:', Math.round(loadTime), 'ms');
      
      // Track Core Web Vitals if supported
      this.trackWebVitals();
    });
  }

  static trackWebVitals() {
    // Largest Contentful Paint
    if ('web-vitals' in window) {
      import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }
  }
}

// =====================================
// SERVICE WORKER REGISTRATION
// =====================================

class ServiceWorkerManager {
  static async init() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              console.log('New content available, reload to update');
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// =====================================
// ERROR HANDLING
// =====================================

class ErrorHandler {
  static init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.logError(event.error);
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(event.reason);
    });
  }

  static logError(error) {
    // Send error to logging service
    console.error('Error logged:', error);
  }
}

// =====================================
// APPLICATION INITIALIZATION
// =====================================

class App {
  constructor() {
    this.themeManager = null;
    this.pwaManager = null;
    this.playerManager = null;
  }

  init() {
    // Initialize core components
    this.themeManager = new ThemeManager();
    this.pwaManager = new PWAManager();
    this.playerManager = new YouTubePlayerManager();
    
    // Initialize utilities
    Performance.init();
    ErrorHandler.init();
    ServiceWorkerManager.init();
    
    // Bind global events
    this.bindGlobalEvents();
    
    console.log('Dark Kokan App initialized successfully');
  }

  bindGlobalEvents() {
    // Subscribe button analytics
    if (elements.subscribeBtn) {
      elements.subscribeBtn.addEventListener('click', () => {
        Analytics.trackSubscribeClick();
      });
    }

    // Network status
    window.addEventListener('online', () => {
      console.log('Connection restored');
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost');
    });

    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playerManager.isModalOpen()) {
        // Pause video when tab becomes hidden
        if (player && typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      }
    });
  }
}

// =====================================
// START APPLICATION
// =====================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}

// Export for external use
window.DarkKokanApp = {
  Utils,
  Analytics,
  Performance
};
