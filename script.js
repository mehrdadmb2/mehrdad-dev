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

// ==================== CUSTOM CURSOR ====================
const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', e => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; });
  document.querySelectorAll('a, button, .glass-card, .skill-card, .project-card, .contact-card, .edu-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
  document.addEventListener('mouseout', () => cursor.style.opacity = '0');
  document.addEventListener('mouseover', () => cursor.style.opacity = '1');
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
      repos.slice(0,6).forEach(repo => {
        const card = document.createElement('div');
        card.className = 'project-card glass';
        const tags = repo.topics ? repo.topics.slice(0,4).map(t => `<span>${t}</span>`).join('') : '';
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
    console.error('GitHub fetch error:', e);
    if (repoEl) repoEl.textContent = '∞';
    if (followersEl) followersEl.textContent = '∞';
    if (starsEl) starsEl.textContent = '∞';
  }
}
fetchGitHubData();

// ==================== MILITARY SERVICE ROADMAP ====================
function updateRoadmap() {
  // Start date: 1404/06/01  => 2025-08-23
  // End date: 1406/03/02    => 2027-05-23
  const start = new Date(2025, 7, 23); // August 23, 2025
  const end = new Date(2027, 4, 23);   // May 23, 2027
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

// ==================== ACTIVE NAV LINK ====================
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.glass-nav a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 150;
    if (pageYOffset >= top && pageYOffset < top + sec.clientHeight) {
      current = sec.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
  });
});
const activeStyle = document.createElement('style');
activeStyle.textContent = '.glass-nav a.active { color: #22d3ee; } .glass-nav a.active::after { width: 100%; }';
document.head.appendChild(activeStyle);

// ==================== PARALLAX AURORA ====================
document.addEventListener('mousemove', e => {
  const aurora = document.getElementById('aurora');
  if (aurora) {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    aurora.style.transform = `translate(${x}px, ${y}px)`;
  }
});

console.log('🚀 Mehrdad Behrouzi Portfolio ready.');


// ==================== COPY ADDRESS ====================
function copyAddress(elementId, btn) {
  const code = document.getElementById(elementId);
  if (!code) return;
  navigator.clipboard.writeText(code.textContent).then(() => {
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    alert('Copy failed. Please select and copy manually.');
  });
}

// ==================== (توابع قبلی بدون تغییر: loader, stars, particles, typing, cursor, github, roadmap) ====================

// ==================== READING PROGRESS BAR ====================
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById('progress-bar').style.width = scrolled + '%';
});

// ==================== BACK TO TOP ====================
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ==================== REVEAL ON SCROLL ====================
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1 });
revealElements.forEach(el => revealObserver.observe(el));

// ==================== SKILL BARS ANIMATION ====================
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

// ==================== INIT MAPS ====================
function initMap(id, lat, lng, zoom = 15) {
  const container = document.getElementById(id);
  if (!container || typeof L === 'undefined') return;
  const map = L.map(id).setView([lat, lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([lat, lng]).addTo(map)
    .bindPopup('Location')
    .openPopup();
  // Fix rendering issue when map is hidden initially
  setTimeout(() => { map.invalidateSize(); }, 300);
}

// Initialize maps after load
window.addEventListener('load', () => {
  // Coordinates: high school 29.623503, 52.475145
  initMap('map-school', 29.623503, 52.475145);
  // University: 29°37'32.8"N 52°29'36.3"E -> 29.625778, 52.493417
  initMap('map-uni', 29.625778, 52.493417);
  // Service location: 29°37'43.5"N 51°38'29.0"E -> 29.62875, 51.64139
  initMap('map-service', 29.62875, 51.64139);
});

// محاسبه و نمایش ستاره تولد با اطلاعات
function updateBirthday() {
  const birthDate = new Date(2001, 9, 13); // 13 اکتبر 2001
  const today = new Date();
  
  // محاسبه سن
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // محاسبه روزهای مانده تا تولد بعدی
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (today > nextBirthday) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const diffTime = nextBirthday - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // به‌روزرسانی محتوای ستاره تولد
  const starElement = document.getElementById('birthday-star');
  if (starElement) {
    starElement.setAttribute('data-tooltip', `${age} years old · ${daysLeft} days until birthday`);
  }
}

// مقداردهی اولیه و به‌روزرسانی هر ساعت
updateBirthday();
setInterval(updateBirthday, 3600000);
