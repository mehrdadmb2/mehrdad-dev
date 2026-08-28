// Loader
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 600);
  }
});

// ==================== STARS BACKGROUND ====================
function createStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  for (let i = 0; i < 200; i++) {
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
    container.appendChild(star);
  }
}
const twinkleStyle = document.createElement('style');
twinkleStyle.textContent = `@keyframes twinkle { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }`;
document.head.appendChild(twinkleStyle);
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
  const geometry = new THREE.BufferGeometry();
  const count = 800;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    pos[i] = (Math.random() - 0.5) * 80;
    pos[i+1] = (Math.random() - 0.5) * 80;
    pos[i+2] = (Math.random() - 0.5) * 40;
    const r = Math.random();
    if (r < 0.33) { col[i]=0.75; col[i+1]=0.52; col[i+2]=0.98; }
    else if (r < 0.66) { col[i]=0.13; col[i+1]=0.83; col[i+2]=0.93; }
    else { col[i]=0.96; col[i+1]=0.45; col[i+2]=0.71; }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 });
  particles = new THREE.Points(geometry, mat);
  scene.add(particles);
}
function animateParticles() {
  if (!particles) return;
  requestAnimationFrame(animateParticles);
  particles.rotation.x += 0.0003;
  particles.rotation.y += 0.0005;
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});
initParticles();
animateParticles();

// ==================== CUSTOM CURSOR ====================
const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', e => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; });
  document.querySelectorAll('a, button, .glass-card, .skill-card, .project-card, .contact-card, .edu-card, .website-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
  document.addEventListener('mouseout', () => cursor.style.opacity = '0');
  document.addEventListener('mouseover', () => cursor.style.opacity = '1');
}

// ==================== TYPING EFFECT ====================
const typingElement = document.querySelector('.typing');
if (typingElement) {
  const words = ['Embedded Developer', 'IoT Architect', 'Network Specialist', 'Python Lover', 'Open Source Contributor'];
  let wordIndex = 0, charIndex = 0, isDeleting = false, currentWord = '';
  function type() {
    const full = words[wordIndex];
    if (isDeleting) { currentWord = full.substring(0, charIndex - 1); charIndex--; }
    else { currentWord = full.substring(0, charIndex + 1); charIndex++; }
    typingElement.textContent = currentWord;
    if (!isDeleting && charIndex === full.length) { isDeleting = true; setTimeout(type, 2000); }
    else if (isDeleting && charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; setTimeout(type, 500); }
    else { setTimeout(type, isDeleting ? 60 : 100); }
  }
  type();
}

// ==================== GITHUB API ====================
async function fetchGitHubData() {
  const username = 'mehrdadmb2';
  const repoEl = document.getElementById('repoCount');
  const followersEl = document.getElementById('followers');
  const starsEl = document.getElementById('starsCount');
  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    const userData = await userRes.json();
    if (repoEl) repoEl.textContent = userData.public_repos || '--';
    if (followersEl) followersEl.textContent = userData.followers || '--';
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    const repos = await reposRes.json();
    const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
    if (starsEl) starsEl.textContent = totalStars || '--';

    const container = document.getElementById('projects-container');
    if (container) {
      container.innerHTML = '';
      repos.slice(0, 6).forEach(repo => {
        const card = document.createElement('div');
        card.className = 'project-card';
        const tags = repo.topics ? repo.topics.slice(0, 4).map(t => `<span>${t}</span>`).join('') : '';
        card.innerHTML = `
          <h3>${repo.name}</h3>
          <p>${repo.description || 'No description'}</p>
          <div class="project-tags">${tags}</div>
          <div class="project-links">
            <a href="${repo.html_url}" target="_blank"><i class="fab fa-github"></i> Source</a>
            ${repo.homepage ? `<a href="${repo.homepage}" target="_blank"><i class="fas fa-external-link-alt"></i> Demo</a>` : ''}
          </div>`;
        container.appendChild(card);
      });
    }
  } catch(e) {
    if (repoEl) repoEl.textContent = '∞';
    if (followersEl) followersEl.textContent = '∞';
    if (starsEl) starsEl.textContent = '∞';
  }
}
fetchGitHubData();

// ==================== MILITARY ROADMAP ====================
function updateRoadmap() {
  const start = new Date(2025, 7, 23);
  const end = new Date(2027, 4, 23);
  const today = new Date();
  const total = end - start;
  const elapsed = today - start;
  const percent = Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
  const roadFill = document.getElementById('road-fill');
  const roadCar = document.getElementById('road-car');
  const progressPercent = document.getElementById('progress-percent');
  const remainingDays = document.getElementById('remaining-days');
  if (roadFill) roadFill.style.width = percent + '%';
  if (roadCar) roadCar.style.left = percent + '%';
  if (progressPercent) progressPercent.textContent = percent + '%';
  if (remainingDays) {
    const remaining = end - today;
    const days = Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24)));
    remainingDays.textContent = days;
  }
}
updateRoadmap();

// ==================== BACK TO TOP ====================
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) backToTopBtn.classList.add('show');
  else backToTopBtn.classList.remove('show');
});
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ==================== SKILL BARS ====================
const skillBars = document.querySelectorAll('.skill-fill');
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bar = entry.target;
      bar.style.width = bar.getAttribute('data-width');
      skillObserver.unobserve(bar);
    }
  });
}, { threshold: 0.3 });
skillBars.forEach(bar => skillObserver.observe(bar));

// ==================== COPY ADDRESS ====================
function copyAddress(elementId, btn) {
  const code = document.getElementById(elementId);
  if (!code) return;
  navigator.clipboard.writeText(code.textContent).then(() => {
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => alert('Copy failed'));
}

// ==================== BIRTHDAY STAR ====================
function updateBirthday() {
  const birthDate = new Date(2001, 9, 13);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (today > nextBirthday) nextBirthday.setFullYear(today.getFullYear() + 1);
  const daysLeft = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
  const starElement = document.getElementById('birthday-star');
  if (starElement) starElement.setAttribute('data-tooltip', `${age} years old · ${daysLeft} days until birthday`);
}
updateBirthday();
setInterval(updateBirthday, 3600000);

// ==================== LAZY LOAD LEAFLET & MAPS ====================
let leafletLoaded = false;
function loadLeaflet(callback) {
  if (leafletLoaded) { callback(); return; }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => { leafletLoaded = true; callback(); };
  document.body.appendChild(script);
}
function initMaps() {
  if (typeof L === 'undefined') return;
  const locations = [
    { id: 'map-school', lat: 29.623503, lng: 52.475145, label: 'Tohidi High School' },
    { id: 'map-uni', lat: 29.625778, lng: 52.493417, label: 'Zand Institute' },
    { id: 'map-service', lat: 29.62875, lng: 51.64139, label: 'Military Base' }
  ];
  locations.forEach(loc => {
    const container = document.getElementById(loc.id);
    if (container && !container._leaflet_id) {
      const map = L.map(loc.id).setView([loc.lat, loc.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(loc.label).openPopup();
      setTimeout(() => map.invalidateSize(), 200);
    }
  });
}
document.getElementById('journey-details').addEventListener('toggle', function() {
  if (this.open) loadLeaflet(initMaps);
});

// ==================== HAIKU ====================
const haikus = [
  { jp: "古池や\n蛙飛びこむ\n水の音", en: "Old pond —\na frog jumps in,\nsound of water.", author: "Matsuo Bashō" },
  { jp: "蛍の火や\n吹き消す風の\n恋しき", en: "Firefly's light —\nthe wind that blows it out\nis dear to me.", author: "Kobayashi Issa" },
  { jp: "我死なば\n筆を捨てよと\n蝉の声", en: "When I die,\nthrow away my brush —\nthe cicada's cry.", author: "Miyamoto Musashi" },
  { jp: "荒海や\n佐渡によこたふ\n天の川", en: "Rough sea —\nstretching out towards Sado,\nthe Milky Way.", author: "Matsuo Bashō" }
];
let currentHaiku = 0;
function showHaiku(index) {
  const jp = document.getElementById('haiku-jp');
  const en = document.getElementById('haiku-en');
  const author = document.getElementById('haiku-author');
  if (jp) jp.innerHTML = haikus[index].jp.replace(/\n/g, '<br>');
  if (en) en.textContent = haikus[index].en;
  if (author) author.textContent = `— ${haikus[index].author}`;
}
if (document.getElementById('haiku-jp')) {
  showHaiku(0);
  setInterval(() => {
    currentHaiku = (currentHaiku + 1) % haikus.length;
    showHaiku(currentHaiku);
  }, 8000);
}
