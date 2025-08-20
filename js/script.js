/* ============================================
   DARK KOKAN - MOBILE APP WEBSITE
   Premium iOS-style JavaScript Implementation
============================================ */

class DarkKokanApp {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.currentVideoId = null;
    
    this.init();
  }

  /* ============================================
     INITIALIZATION
  ============================================ */
  init() {
    this.setupEventListeners();
    this.checkInstallStatus();
    this.setupPWA();
    this.handleSystemTheme();
    this.preloadVideoThumbnails();
    
    console.log('🎬 Dark Kokan App initialized');
  }

  /* ============================================
     EVENT LISTENERS SETUP
  ============================================ */
  setupEventListeners() {
    // Install banner events
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissBtn');
    
    if (installBtn) installBtn.addEventListener('click', () => this.handleInstall());
    if (dismissBtn) dismissBtn.addEventListener('click', () => this.dismissInstallBanner());

    // Video card click events
    document.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.closest('.video-actions')) return;
        
        const videoId = card.dataset.videoId;
        if (videoId) {
          this.playVideo(videoId);
        }
      });
    });

    // Modal close events
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-backdrop') || e.target.matches('.modal-close')) {
        this.closeVideoModal();
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeVideoModal();
        this.dismissInstallBanner();
      }
    });

    // Prevent context menu on long press (iOS style)
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.video-card') || e.target.closest('button')) {
        e.preventDefault();
      }
    });

    // Handle visibility change (pause videos when hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentVideoId) {
        this.pauseCurrentVideo();
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => this.showNetworkStatus('online'));
    window.addEventListener('offline', () => this.showNetworkStatus('offline'));
  }

  /* ============================================
     PWA INSTALLATION HANDLING
  ============================================ */
  setupPWA() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('💾 PWA install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show install banner after a delay if not already installed
      if (!this.isInstalled) {
        setTimeout(() => this.showInstallBanner(), 3000);
      }
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallBanner();
      this.showToast('App installed successfully! 🎉');
      
      // Store installation status
      localStorage.setItem('darkKokanInstalled', 'true');
    });

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 Running in standalone mode');
    }
  }

  checkInstallStatus() {
    const wasInstalled = localStorage.getItem('darkKokanInstalled');
    const wasDismissed = localStorage.getItem('installBannerDismissed');
    const dismissedTime = localStorage.getItem('installBannerDismissedTime');
    
    if (wasInstalled === 'true') {
      this.isInstalled = true;
    }

    // Show banner again after 7 days if previously dismissed
    if (wasDismissed === 'true' && dismissedTime) {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (parseInt(dismissedTime) < weekAgo) {
        localStorage.removeItem('installBannerDismissed');
        localStorage.removeItem('installBannerDismissedTime');
      }
    }
  }

  showInstallBanner() {
    const wasDismissed = localStorage.getItem('installBannerDismissed');
    
    if (this.isInstalled || wasDismissed === 'true') {
      return;
    }

    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.remove('hidden');
      
      // Add entrance animation
      requestAnimationFrame(() => {
        banner.style.animation = 'bannerFadeIn 0.3s ease-out';
      });

      // Track banner shown
      console.log('📋 Install banner shown');
    }
  }

  hideInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.style.animation = 'bannerFadeOut 0.3s ease-out';
      setTimeout(() => banner.classList.add('hidden'), 300);
    }
  }

  async handleInstall() {
    if (!this.deferredPrompt) {
      this.showToast('Installation not available on this device');
      return;
    }

    try {
      // Show the install prompt
      const result = await this.deferredPrompt.prompt();
      console.log('🎯 Install prompt result:', result.outcome);

      if (result.outcome === 'accepted') {
        this.showToast('Installing app... Please wait');
      } else {
        this.showToast('Installation cancelled');
      }

      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.hideInstallBanner();
      
    } catch (error) {
      console.error('❌ Installation failed:', error);
      this.showToast('Installation failed. Please try again.');
    }
  }

  dismissInstallBanner() {
    this.hideInstallBanner();
    
    // Store dismissal with timestamp
    localStorage.setItem('installBannerDismissed', 'true');
    localStorage.setItem('installBannerDismissedTime', Date.now().toString());
    
    console.log('🚫 Install banner dismissed');
  }

  /* ============================================
     VIDEO PLAYBACK FUNCTIONALITY
  ============================================ */
  playVideo(videoId) {
    if (!videoId) return;
    
    console.log('▶️ Playing video:', videoId);
    this.currentVideoId = videoId;
    
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    if (modal && player) {
      // Construct YouTube embed URL with optimal parameters
      const embedUrl = `https://www.youtube.com/embed/${videoId}?` + 
        'autoplay=1&' +
        'rel=0&' +
        'showinfo=0&' +
        'iv_load_policy=3&' +
        'modestbranding=1&' +
        'playsinline=1&' +
        'enablejsapi=1';
      
      player.src = embedUrl;
      modal.classList.remove('hidden');
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus trap for accessibility
      this.trapFocus(modal);
      
      // Track video play
      this.trackEvent('video_play', { video_id: videoId });
    }
  }

  closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    if (modal && player) {
      // Stop video by clearing src
      player.src = '';
      modal.classList.add('hidden');
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      this.currentVideoId = null;
      console.log('⏹️ Video modal closed');
    }
  }

  pauseCurrentVideo() {
    // Send pause command to YouTube iframe (if API is available)
    const player = document.getElementById('videoPlayer');
    if (player && player.contentWindow) {
      try {
        player.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          'https://www.youtube.com'
        );
      } catch (error) {
        console.log('Could not pause video:', error);
      }
    }
  }

  openOnYouTube(videoId) {
    if (!videoId) return;
    
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Try to open in YouTube app first (mobile), then fallback to browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      // Try YouTube app URL scheme for iOS
      const appUrl = `youtube://watch?v=${videoId}`;
      window.location.href = appUrl;
      
      // Fallback to web after delay
      setTimeout(() => {
        window.open(youtubeUrl, '_blank');
      }, 500);
    } else if (isAndroid) {
      // Try intent URL for Android
      const intentUrl = `intent://www.youtube.com/watch?v=${videoId}#Intent;package=com.google.android.youtube;scheme=https;end`;
      window.location.href = intentUrl;
      
      // Fallback to web
      setTimeout(() => {
        window.open(youtubeUrl, '_blank');
      }, 500);
    } else {
      // Desktop - just open in new tab
      window.open(youtubeUrl, '_blank');
    }
    
    // Track external link click
    this.trackEvent('youtube_redirect', { video_id: videoId });
    
    console.log('🔗 Redirecting to YouTube:', videoId);
  }

  /* ============================================
     THEME HANDLING
  ============================================ */
  handleSystemTheme() {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      console.log('🌙 System theme changed to:', e.matches ? 'dark' : 'light');
      this.updateThemeColor(e.matches);
    });
    
    // Set initial theme color
    this.updateThemeColor(mediaQuery.matches);
  }

  updateThemeColor(isDark) {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = isDark ? '#1c1c1e' : '#ffffff';
    }
  }

  /* ============================================
     UTILITY FUNCTIONS
  ============================================ */
  preloadVideoThumbnails() {
    // Preload video thumbnails for better UX
    const thumbnails = document.querySelectorAll('.video-thumbnail img');
    thumbnails.forEach(img => {
      if (img.loading !== 'lazy') {
        const tempImg = new Image();
        tempImg.src = img.src;
      }
    });
  }

  showToast(message, duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: calc(20px + var(--safe-area-bottom));
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px var(--shadow-medium);
      border: 0.5px solid var(--border-primary);
      z-index: 1001;
      animation: toastSlideUp 0.3s ease-out;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      max-width: calc(100vw - 40px);
      text-align: center;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes toastSlideUp {
        from {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
      @keyframes toastSlideDown {
        from {
          transform: translate(-50%, 0);
          opacity: 1;
        }
        to {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Auto remove toast
    setTimeout(() => {
      toast.style.animation = 'toastSlideDown 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
        style.remove();
      }, 300);
    }, duration);
  }

  showNetworkStatus(status) {
    const message = status === 'online' 
      ? '🟢 Back online' 
      : '🔴 No internet connection';
    
    this.showToast(message, status === 'online' ? 2000 : 5000);
  }

  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstFocusable.focus();
    
    const handleTab = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleTab);
    
    // Remove event listener when modal closes
    const originalClose = this.closeVideoModal.bind(this);
    this.closeVideoModal = () => {
      element.removeEventListener('keydown', handleTab);
      originalClose();
    };
  }

  trackEvent(eventName, properties = {}) {
    // Analytics tracking (replace with your preferred analytics service)
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    console.log('📊 Event tracked:', eventName, properties);
  }

  /* ============================================
     PERFORMANCE OPTIMIZATION
  ============================================ */
  debounce(func, wait) {
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

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
}

/* ============================================
   GLOBAL FUNCTIONS (for HTML onclick handlers)
============================================ */
window.playVideo = function(videoId) {
  if (window.darkKokanApp) {
    window.darkKokanApp.playVideo(videoId);
  }
};

window.openOnYouTube = function(videoId) {
  if (window.darkKokanApp) {
    window.darkKokanApp.openOnYouTube(videoId);
  }
};

window.closeVideoModal = function() {
  if (window.darkKokanApp) {
    window.darkKokanApp.closeVideoModal();
  }
};

/* ============================================
   INITIALIZE APP WHEN DOM IS READY
============================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  // Initialize the main app
  window.darkKokanApp = new DarkKokanApp();
  
  // Service Worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ ServiceWorker registered:', registration.scope);
      })
      .catch(error => {
        console.log('❌ ServiceWorker registration failed:', error);
      });
  }
  
  // Initialize intersection observer for lazy loading enhancements
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('.video-thumbnail img').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  console.log('🎬 Dark Kokan app fully initialized!');
}

/* ============================================
   ERROR HANDLING
============================================ */
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
  
  // Show user-friendly error message
  if (window.darkKokanApp) {
    window.darkKokanApp.showToast('Something went wrong. Please refresh the page.');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

/* ============================================
   PERFORMANCE MONITORING
============================================ */
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('⚡ Page load performance:', {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart
      });
    }, 0);
  });
}

/* ============================================
   ADDITIONAL CSS FOR JS-GENERATED ELEMENTS
============================================ */
const additionalStyles = `
  .loaded {
    animation: imageLoaded 0.3s ease-out;
  }
  
  @keyframes imageLoaded {
    from { opacity: 0.8; }
    to { opacity: 1; }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
