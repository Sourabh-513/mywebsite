// js/script.js
window.addEventListener('DOMContentLoaded', () => {
  // Load video data
  fetch('data/videos.json')
    .then(response => response.json())
    .then(data => {
      const videoSection = document.querySelector('.video-section');
      data.forEach(video => {
        const videoCard = createVideoCard(video);
        videoSection.appendChild(videoCard);
      });
    })
    .catch(error => console.error('Error loading video data:', error));

  // Load podcast data
  fetch('data/spotify.json')
    .then(response => response.json())
    .then(data => {
      const podcastSection = document.querySelector('.podcast-section');
      data.forEach(podcast => {
        const podcastCard = createPodcastCard(podcast);
        podcastSection.appendChild(podcastCard);
      });
    })
    .catch(error => console.error('Error loading podcast data:', error));

  // Theme switching functionality
  const themeToggleBtn = document.querySelector('.theme-toggle-btn');
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Set initial theme based on user preference
  setInitialTheme();
});

function createVideoCard(video) {
  // Create and populate the video card elements
  const videoCard = document.createElement('div');
  videoCard.classList.add('video-card');

  const img = document.createElement('img');
  img.src = `https://img.youtube.com/vi/${video.url.split('=')[1]}/maxresdefault.jpg`;
  img.alt = video.title;

  const cardContent = document.createElement('div');
  cardContent.classList.add('video-card-content');

  const title = document.createElement('h2');
  title.classList.add('video-title');
  title.textContent = video.title;

  const description = document.createElement('p');
  description.classList.add('video-description');
  description.textContent = video.description;

  const actions = document.createElement('div');
  actions.classList.add('video-actions');

  const watchNowBtn = document.createElement('button');
  watchNowBtn.classList.add('watch-now-btn');
  watchNowBtn.textContent = 'Watch Now';
  watchNowBtn.addEventListener('click', () => {
    handleWatchNowClick(video.url);
  });

  const watchOnYouTubeBtn = document.createElement('a');
  watchOnYouTubeBtn.classList.add('watch-on-youtube-btn');
  watchOnYouTubeBtn.href = video.url;
  watchOnYouTubeBtn.textContent = 'Watch on YouTube';
  watchOnYouTubeBtn.target = '_blank';

  actions.appendChild(watchNowBtn);
  actions.appendChild(watchOnYouTubeBtn);

  cardContent.appendChild(title);
  cardContent.appendChild(description);
  cardContent.appendChild(actions);

  videoCard.appendChild(img);
  videoCard.appendChild(cardContent);

  return videoCard;
}

function createPodcastCard(podcast) {
  // Create and populate the podcast card elements
  const podcastCard = document.createElement('div');
  podcastCard.classList.add('podcast-card');

  const img = document.createElement('img');
  img.src = podcast.imageUrl;
  img.alt = podcast.title;

  const cardContent = document.createElement('div');
  cardContent.classList.add('podcast-card-content');

  const title = document.createElement('h2');
  title.classList.add('podcast-title');
  title.textContent = podcast.title;

  const description = document.createElement('p');
  description.classList.add('podcast-description');
  description.textContent = podcast.description;

  const actions = document.createElement('div');
  actions.classList.add('podcast-actions');

  const listenOnSpotifyBtn = document.createElement('a');
  listenOnSpotifyBtn.classList.add('listen-on-spotify-btn');
  listenOnSpotifyBtn.href = podcast.url;
  listenOnSpotifyBtn.textContent = 'Listen on Spotify';
  listenOnSpotifyBtn.target = '_blank';

  actions.appendChild(listenOnSpotifyBtn);

  cardContent.appendChild(title);
  cardContent.appendChild(description);
  cardContent.appendChild(actions);

  podcastCard.appendChild(img);
  podcastCard.appendChild(cardContent);

  return podcastCard;
}

function handleWatchNowClick(videoUrl) {
  // Open the video in a modal or new tab
  window.open(videoUrl, '_blank');
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function setInitialTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
}
