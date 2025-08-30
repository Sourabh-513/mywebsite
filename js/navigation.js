/* ==========================================
   NAVIGATION & SECTION MANAGEMENT
   ========================================== */

// Global state management
let currentSection = 'horror';
let sectionsData = {
  horror: { loaded: false, data: [] },
  mysterious: { loaded: false, data: [] },
  spotify: { loaded: false, data: [] }
};

// Ad unlock system for Spotify
let spotifyUnlocked = false;
let lastAdWatch = 0;
const AD_COOLDOWN = 30000; // 30 seconds

// Initialize navigation system
document.addEventListener('DOMContentLoaded', function() {
  initializeNavigation();
  loadInitialSection();
});

/* ==========================================
   NAVIGATION FUNCTIONS
   ========================================== */

function initializeNavigation() {
  console.log('🚀 Initializing navigation system...');
  
  // Set up navigation event listeners
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      if (section !== currentSection) {
        switchSection(section);
      }
    });
  });
  
  // Initialize with horror section active
  updateActiveTab('horror');
  
  console.log('✅ Navigation system initialized');
}

function switchSection(sectionName) {
  console.log(`🔄 Switching to section: ${sectionName}`);
  
  // Track section switch with Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'section_switch', {
      event_category: 'navigation',
      event_label: sectionName,
      previous_section: currentSection
    });
  }
  
  // Handle ad interaction for non-horror sections
  if (sectionName !== 'horror' && shouldShowAd()) {
    handleClick(); // Trigger ad system from main script
  }
  
  // Update UI
  updateActiveTab(sectionName);
  showSection(sectionName);
  
  // Load section content if needed
  loadSectionContent(sectionName);
  
  // Update current section
  currentSection = sectionName;
  
  // Update URL hash without page reload
  history.replaceState(null, null, `#${sectionName}`);
  
  console.log(`✅ Switched to ${sectionName} section`);
}

function updateActiveTab(sectionName) {
  // Remove active class from all tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to current tab
  const activeTab = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
}

function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.remove('active', 'entering');
    section.classList.add('exiting');
  });
  
  // Show target section with animation
  setTimeout(() => {
    sections.forEach(section => {
      section.classList.remove('exiting');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active', 'entering');
      
      // Remove entering class after animation
      setTimeout(() => {
        targetSection.classList.remove('entering');
      }, 400);
    }
  }, 50);
}

/* ==========================================
   CONTENT LOADING FUNCTIONS
   ========================================== */

function loadInitialSection() {
  // Check URL hash for initial section
  const hash = window.location.hash.replace('#', '');
  const initialSection = ['horror', 'mysterious', 'spotify'].includes(hash) ? hash : 'horror';
  
  // Load content for initial section
  loadSectionContent(initialSection);
  
  // Switch to initial section if not horror
  if (initialSection !== 'horror') {
    switchSection(initialSection);
  }
}

async function loadSectionContent(sectionName) {
  // Skip if already loaded
  if (sectionsData[sectionName].loaded) {
    return;
  }
  
  console.log(`📥 Loading ${sectionName} content...`);
  
  const container = document.getElementById(`${sectionName}-${sectionName === 'spotify' ? 'content' : 'videos'}`);
  
  if (!container) {
    console.error(`❌ Container not found for ${sectionName}`);
    return;
  }
  
  // Show loading state
  showLoadingState(container);
  
  try {
    // Load data from JSON file
    const data = await loadSectionData(sectionName);
    
    if (data && data.length > 0) {
      // Render content
      if (sectionName === 'spotify') {
        renderSpotifyContent(data, container);
      } else {
        renderVideoContent(data, container);
      }
      
      // Mark as loaded
      sectionsData[sectionName] = {
        loaded: true,
        data: data
      };
      
      console.log(`✅ ${sectionName} content loaded (${data.length} items)`);
    } else {
      showEmptyState(container, sectionName);
    }
    
  } catch (error) {
    console.error(`❌ Error loading ${sectionName} content:`, error);
    showErrorState(container, sectionName);
  }
}

async function loadSectionData(sectionName) {
  try {
    const response = await fetch(`/data/${sectionName}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to load ${sectionName} data:`, error);
    
    // Fallback data for development
    return getFallbackData(sectionName);
  }
}

function getFallbackData(sectionName) {
  const fallbackData = {
    horror: [
      {
        id: "PCKNptxYuSw",
        title: "सह्याद्री की परछाइयाँ",
        description: "हंसी-मज़ाक से शुरू हुई बाइक यात्रा, पर अंधेरी रात ने इसे बदल दिया एक भयानक कहानी में…",
        thumbnail: "https://i.ytimg.com/vi/PCKNptxYuSw/maxresdefault.jpg",
        duration: "12:45",
        category: "horror"
      }
    ],
    mysterious: [
      {
        id: "example123",
        title: "रहस्यमय घटना",
        description: "एक अनसुलझी रहस्यमय घटना जो आज भी लोगों को हैरान करती है...",
        thumbnail: "https://i.ytimg.com/vi/example123/maxresdefault.jpg",
        duration: "15:30",
        category: "mysterious"
      }
    ],
    spotify: [
      {
        id: "spotify-track-1",
        title: "भूतिया आवाज़ें",
        description: "रात की गहराई में सुनाई देने वाली रहस्यमय आवाज़ों की कहानी",
        thumbnail: "/assets/images/logo.png",
        spotifyUrl: "https://open.spotify.com/episode/example",
        duration: "18:22",
        locked: true
      }
    ]
  };
  
  return fallbackData[sectionName] || [];
}

/* ==========================================
   CONTENT RENDERING FUNCTIONS
   ========================================== */

function renderVideoContent(videos, container) {
  container.innerHTML = videos.map(video => `
    <div class="video-card" onclick="handleClick(); playVideo('${video.id}', '${escapeHtml(video.title)}');">
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" 
             alt="${escapeHtml(video.title)}"
             onerror="this.src='https://i.ytimg.com/vi/${video.id}/hqdefault.jpg'">
        <div class="play-overlay">
          <div class="play-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        ${video.duration ? `<div class="video-duration">${video.duration}</div>` : ''}
      </div>
      <div class="video-info">
        <h3 class="video-title">${escapeHtml(video.title)}</h3>
        <p class="video-description">${escapeHtml(video.description)}</p>
        
        <!-- Credit Line -->
        <div class="video-credits">
          <span class="credits-icon">🎬</span>
          <span class="credits-text">Concept, Script & Production: Saurabh Bolade</span>
        </div>
        
        <div class="video-actions">
          <button class="watch-btn primary" onclick="event.stopPropagation(); handleClick(); playVideo('${video.id}', '${escapeHtml(video.title)}');">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            Watch Now
          </button>
          <button class="watch-btn secondary" onclick="event.stopPropagation(); handleClick(); openYouTube('https://www.youtube.com/watch?v=${video.id}');">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 12s-3.5-9-11-9S1 12 1 12s3.5 9 11 9 11-9 11-9z" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            Watch on YouTube
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderSpotifyContent(tracks, container) {
  container.innerHTML = tracks.map(track => `
    <div class="spotify-card ${track.locked && !spotifyUnlocked ? 'locked' : ''}" 
         onclick="${track.locked && !spotifyUnlocked ? 'showSpotifyUnlock()' : `handleClick(); openSpotify('${track.spotifyUrl}', '${escapeHtml(track.title)}')`}">
      <div class="spotify-thumbnail">
        <img src="${track.thumbnail || '/assets/images/logo.png'}" 
             alt="${escapeHtml(track.title)}"
             onerror="this.src='/assets/images/logo.png'">
        <div class="spotify-play-overlay">
          <div class="spotify-play-icon">
            ${track.locked && !spotifyUnlocked ? '🔒' : '▶️'}
          </div>
        </div>
      </div>
      <div class="spotify-info">
        <h3 class="spotify-title">${escapeHtml(track.title)}</h3>
        <p class="spotify-description">${escapeHtml(track.description)}</p>
        <div class="spotify-actions">
          <button class="spotify-btn primary" 
                  onclick="event.stopPropagation(); ${track.locked && !spotifyUnlocked ? 'showSpotifyUnlock()' : `handleClick(); openSpotify('${track.spotifyUrl}', '${escapeHtml(track.title)}')`}"
                  ${track.locked && !spotifyUnlocked ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.54c-.25.4-.72.52-1.16.3-.32-.14-.64-.29-.96-.46-.96-.48-1.92-.96-2.88-1.44-.32-.16-.64-.32-.96-.48-.25-.12-.4-.36-.4-.64s.15-.52.4-.64c.32-.16.64-.32.96-.48.96-.48 1.92-.96 2.88-1.44.32-.17.64-.32.96-.46.44-.22.91-.1 1.16.3.25.4.15.91-.3 1.16z" fill="currentColor"/>
            </svg>
            ${track.locked && !spotifyUnlocked ? 'Watch Ad to Unlock' : 'Listen on Spotify'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ==========================================
   SPOTIFY UNLOCK SYSTEM
   ========================================== */

function showSpotifyUnlock() {
  const modalHtml = `
    <div class="spotify-unlock-modal">
      <div class="unlock-icon-large">🔒</div>
      <h3>Exclusive Audio Content</h3>
      <p>Watch a quick ad to unlock all audio stories on Spotify for the next 30 minutes!</p>
      <div class="unlock-actions">
        <button onclick="watchAdForSpotify()" class="unlock-ad-btn">
          <span class="ad-icon">📺</span>
          Watch Ad to Unlock
        </button>
        <button onclick="closeCustomModal()" class="unlock-cancel-btn">Maybe Later</button>
      </div>
      <div class="unlock-benefits">
        <div class="benefit-item">
          <span class="benefit-icon">🎧</span>
          <span>Full Audio Stories</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">⏱️</span>
          <span>30 Minutes Access</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🎬</span>
          <span>Support Creator</span>
        </div>
      </div>
    </div>
  `;
  
  showModal('🎧 Unlock Audio Stories', modalHtml);
  
  // Track unlock attempt
  if (typeof gtag !== 'undefined') {
    gtag('event', 'spotify_unlock_attempt', {
      event_category: 'engagement',
      event_label: 'modal_shown'
    });
  }
}

function watchAdForSpotify() {
  console.log('🎬 Starting ad for Spotify unlock...');
  
  // Close modal first
  closeCustomModal();
  
  // Show ad (this will use your existing ad system)
  showAd(() => {
    // Success callback - unlock Spotify content
    spotifyUnlocked = true;
    lastAdWatch = Date.now();
    
    // Show success message
    showToast('🎧 Spotify content unlocked for 30 minutes!', 'success', 4000);
    
    // Refresh Spotify section content
    refreshSpotifyContent();
    
    // Track successful unlock
    if (typeof gtag !== 'undefined') {
      gtag('event', 'spotify_unlocked', {
        event_category: 'monetization',
        event_label: 'ad_watched'
      });
    }
    
    // Auto-lock after 30 minutes
    setTimeout(() => {
      spotifyUnlocked = false;
      showToast('🔒 Spotify content locked again. Watch another ad to unlock!', 'info', 3000);
      
      // Refresh content to show locked state
      if (currentSection === 'spotify') {
        refreshSpotifyContent();
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    console.log('✅ Spotify content unlocked');
  });
}

function refreshSpotifyContent() {
  if (sectionsData.spotify.loaded) {
    const container = document.getElementById('spotify-content');
    renderSpotifyContent(sectionsData.spotify.data, container);
  }
}

/* ==========================================
   SPOTIFY INTERACTION FUNCTIONS
   ========================================== */

function openSpotify(url, title) {
  console.log(`🎧 Opening Spotify: ${title}`);
  
  // Track Spotify interaction
  if (typeof gtag !== 'undefined') {
    gtag('event', 'spotify_click', {
      event_category: 'external_link',
      event_label: title,
      transport_type: 'beacon'
    });
  }
  
  // Try to open in Spotify app first, fallback to web
  const spotifyAppUrl = url.replace('open.spotify.com', 'spotify');
  
  // Create temporary link for app detection
  const appLink = document.createElement('a');
  appLink.href = spotifyAppUrl;
  appLink.style.display = 'none';
  document.body.appendChild(appLink);
  appLink.click();
  document.body.removeChild(appLink);
  
  // Fallback to web after short delay
  setTimeout(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, 1000);
}

/* ==========================================
   UI STATE FUNCTIONS
   ========================================== */

function showLoadingState(container) {
  container.innerHTML = `
    <div class="section-loading">
      <div class="section-loading-spinner"></div>
      <p>Loading content...</p>
    </div>
  `;
}

function showEmptyState(container, sectionName) {
  const emptyStates = {
    horror: { icon: '👻', title: 'No Horror Stories', desc: 'New scary content coming soon!' },
    mysterious: { icon: '🕵️', title: 'No Mysteries Yet', desc: 'Mysterious tales will appear here' },
    spotify: { icon: '🎧', title: 'No Audio Stories', desc: 'Audio content will be available soon' }
  };
  
  const state = emptyStates[sectionName] || emptyStates.horror;
  
  container.innerHTML = `
    <div class="section-empty">
      <div class="empty-icon">${state.icon}</div>
      <h3 class="empty-title">${state.title}</h3>
      <p class="empty-description">${state.desc}</p>
    </div>
  `;
}

function showErrorState(container, sectionName) {
  container.innerHTML = `
    <div class="section-empty">
      <div class="empty-icon">⚠️</div>
      <h3 class="empty-title">Failed to Load Content</h3>
      <p class="empty-description">Please check your connection and try again</p>
      <button onclick="loadSectionContent('${sectionName}')" class="retry-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2"/>
        </svg>
        Try Again
      </button>
    </div>
  `;
}

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function shouldShowAd() {
  const now = Date.now();
  return (now - lastAdWatch) > AD_COOLDOWN;
}

// Handle browser back/forward navigation
window.addEventListener('popstate', function(event) {
  const hash = window.location.hash.replace('#', '');
  if (['horror', 'mysterious', 'spotify'].includes(hash)) {
    switchSection(hash);
  }
});

// Export functions for global access
window.switchSection = switchSection;
window.showSpotifyUnlock = showSpotifyUnlock;
window.watchAdForSpotify = watchAdForSpotify;
window.openSpotify = openSpotify;

console.log('📱 Navigation system loaded');
