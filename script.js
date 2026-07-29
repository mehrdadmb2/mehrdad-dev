// ==================== LOADER ====================
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 600);
  }
});

// ==================== STARS BACKGROUND ====================
function createStars() {
  const starsContainer = document.getElementById('stars');
  if (!starsContainer) return;
  const count = 200;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 3 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.background = 'white';
    star.style.borderRadius = '50%';
    star.style.position = 'absolute';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.opacity = Math.random() * 0.8 + 0.2;
    star.style.animation = `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`;
    starsContainer.appendChild(star);
  }
}

// Add twinkle animation dynamically
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.5); }
  }
`;
document.head.appendChild(styleSheet);

createStars();

// ==================== THREE.JS PARTICLES ====================
let scene, camera, renderer, particles;

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 800;
  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 80;
    positions[i + 1] = (Math.random() - 0.5) * 80;
    positions[i + 2] = (Math.random() - 0.5) * 40;

    // Neon colors
    const colorChoice = Math.random();
    if (colorChoice < 0.33) {
      colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.98; // purple
    } else if (colorChoice < 0.66) {
      colors[i] = 0.13; colors[i + 1] = 0.83; colors[i + 2] = 0.93; // cyan
    } else {
      colors[i] = 0.96; colors[i + 1] = 0.45; colors[i + 2] = 0.71; // pink
    }
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.6,
  });

  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);
}

function animateParticles() {
  if (!particles) return;
  requestAnimationFrame(animateParticles);
  particles.rotation.x += 0.0003;
  particles.rotation.y += 0.0005;
  renderer.render(scene, camera);
}

function onResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener('resize', onResize);

initParticles();
animateParticles();

// ==================== TYPING EFFECT ====================
const typingElement = document.querySelector('.typing');
if (typingElement) {
  const words = [
    'Computer Engineer',
    'IoT Developer',
    'Embedded Systems',
    'Python Lover',
    'Open Source Contributor',
    'Future Builder'
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let currentWord = '';
  const typeSpeed = 100;
  const deleteSpeed = 60;
  const delayBetween = 2000;

  function type() {
    const fullWord = words[wordIndex];
    if (isDeleting) {
      currentWord = fullWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      currentWord = fullWord.substring(0, charIndex + 1);
      charIndex++;
    }

    typingElement.textContent = currentWord;

    if (!isDeleting && charIndex === fullWord.length) {
      isDeleting = true;
      setTimeout(type, delayBetween);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(type, 500);
    } else {
      setTimeout(type, isDeleting ? deleteSpeed : typeSpeed);
    }
  }

  type();
}

// ==================== CUSTOM CURSOR ====================
const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Add hover effect on interactive elements
  const hoverTargets = document.querySelectorAll('a, button, .glass-card, .skill-card, .project-card, .contact-card, .timeline-item');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseout', () => {
    cursor.style.opacity = '0';
  });
  document.addEventListener('mouseover', () => {
    cursor.style.opacity = '1';
  });
}

// ==================== GITHUB API ====================
async function fetchGitHubData() {
  const username = 'mehrdadmb2'; // Change to your GitHub username
  const repoCountEl = document.getElementById('repoCount');
  const followersEl = document.getElementById('followers');
  const starsCountEl = document.getElementById('starsCount');

  try {
    // User data
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    const userData = await userResponse.json();
    if (repoCountEl) repoCountEl.textContent = userData.public_repos || '--';
    if (followersEl) followersEl.textContent = userData.followers || '--';

    // Stars count (sum over all repos)
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    const repos = await reposResponse.json();
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    if (starsCountEl) starsCountEl.textContent = totalStars || '--';

    // Populate projects
    populateProjects(repos.slice(0, 6)); // latest 6
  } catch (error) {
    console.error('GitHub fetch error:', error);
    if (repoCountEl) repoCountEl.textContent = '∞';
    if (followersEl) followersEl.textContent = '∞';
    if (starsCountEl) starsCountEl.textContent = '∞';
  }
}

function populateProjects(repos) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  container.innerHTML = '';

  repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'project-card';

    const tagsHTML = repo.topics && repo.topics.length
      ? repo.topics.slice(0, 4).map(tag => `<span>${tag}</span>`).join('')
      : '';

    card.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description || 'No description available.'}</p>
      <div class="project-tags">${tagsHTML}</div>
      <div class="project-links">
        <a href="${repo.html_url}" target="_blank"><i class="fab fa-github"></i> Source</a>
        ${repo.homepage ? `<a href="${repo.homepage}" target="_blank"><i class="fas fa-external-link-alt"></i> Demo</a>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

fetchGitHubData();

// ==================== SMOOTH SCROLL & ACTIVE NAV ====================
const navLinks = document.querySelectorAll('.glass-nav a');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Add active style via CSS (already in style.css? add some)
const activeStyle = document.createElement('style');
activeStyle.textContent = `
  .glass-nav ul li a.active {
    color: #22d3ee;
  }
  .glass-nav ul li a.active::after {
    width: 100%;
  }
`;
document.head.appendChild(activeStyle);

// ==================== THEME TOGGLE (Optional - Dark/Light) ====================
// Already dark mode design, but can add simple switch if needed
const themeBtn = document.getElementById('theme');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
    // Could store preference
  });
}

// ==================== PARALLAX EFFECT ON MOUSE (optional) ====================
document.addEventListener('mousemove', (e) => {
  const aurora = document.getElementById('aurora');
  if (aurora) {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    aurora.style.transform = `translate(${x}px, ${y}px)`;
  }
});

console.log('🚀 Mehrdad Portfolio ready — Galaxy Mode Active');
