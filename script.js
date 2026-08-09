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
  document.querySelectorAll('a, button, .glass-card, .skill-card, .project-card, .contact-card, .edu-card, .website-card').forEach(el => {
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
        card.className = 'project-card glass-card';
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
    setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => { alert('Copy failed. Please select and copy manually.'); });
}

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
  if (window.scrollY > 500) backToTopBtn.classList.add('show');
  else backToTopBtn.classList.remove('show');
});
backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

// ==================== REVEAL ON SCROLL ====================
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  L.marker([lat, lng]).addTo(map).bindPopup('Location').openPopup();
  setTimeout(() => { map.invalidateSize(); }, 300);
}
window.addEventListener('load', () => {
  initMap('map-school', 29.623503, 52.475145);
  initMap('map-uni', 29.625778, 52.493417);
  initMap('map-service', 29.62875, 51.64139);
});

// ==================== BIRTHDAY STAR ====================
function updateBirthday() {
  const birthDate = new Date(2001, 9, 13);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) { age--; }
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (today > nextBirthday) nextBirthday.setFullYear(today.getFullYear() + 1);
  const diffTime = nextBirthday - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const starElement = document.getElementById('birthday-star');
  if (starElement) { starElement.setAttribute('data-tooltip', `${age} years old · ${daysLeft} days until birthday`); }
}
updateBirthday();
setInterval(updateBirthday, 3600000);

// ==================== BRUSH TRAIL ====================
(function() {
  const canvas = document.getElementById('brush-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let mouseX = -100, mouseY = -100;
  let prevX = -100, prevY = -100;
  const points = [];

  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  const colors = ['#c084fc', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'];

  function draw() {
    if (prevX < 0 || prevY < 0) { prevX = mouseX; prevY = mouseY; }
    const dx = mouseX - prevX;
    const dy = mouseY - prevY;
    const dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > 3) {
      points.push({
        x: mouseX, y: mouseY, alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1
      });
      prevX = mouseX; prevY = mouseY;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      p.alpha -= 0.015;
      if (p.alpha <= 0) { points.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * 0.4;
      ctx.fill();
      if (i > 0) {
        const prev = points[i-1];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

// ==================== FLOATING SHAPES ====================
(function() {
  const container = document.getElementById('shapes-bg');
  if (!container) return;
  const shapes = ['triangle', 'circle', 'diamond'];
  for (let i = 0; i < 15; i++) {
    const el = document.createElement('div');
    const type = shapes[Math.floor(Math.random() * shapes.length)];
    el.className = `shape ${type}`;
    el.style.left = Math.random() * 90 + '%';
    el.style.top = Math.random() * 80 + 20 + '%';
    el.style.animationDuration = (Math.random() * 20 + 15) + 's';
    el.style.animationDelay = Math.random() * 10 + 's';
    container.appendChild(el);
  }
})();

// ==================== CONSTELLATIONS ====================
(function() {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  const stars = [];
  const numStars = 50;

  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < stars.length; i++) {
      const s1 = stars[i];
      for (let j = i+1; j < stars.length; j++) {
        const s2 = stars[j];
        const dx = s1.x - s2.x;
        const dy = s1.y - s2.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.3;
          ctx.globalAlpha = (1 - dist/150) * 0.15;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    stars.forEach(s => {
      s.x += (Math.random() - 0.5) * 0.1;
      s.y += (Math.random() - 0.5) * 0.1;
      if (s.x < 0 || s.x > width) s.x = Math.random() * width;
      if (s.y < 0 || s.y > height) s.y = Math.random() * height;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ==================== HAIKU ROTATOR ====================
const haikus = [
  { jp: "古池や\n蛙飛びこむ\n水の音", en: "Old pond —\na frog jumps in,\nsound of water.", author: "Matsuo Bashō" },
  { jp: "蛍の火や\n吹き消す風の\n恋しき", en: "Firefly's light —\nthe wind that blows it out\nis dear to me.", author: "Kobayashi Issa" },
  { jp: "我死なば\n筆を捨てよと\n蝉の声", en: "When I die,\nthrow away my brush —\nthe cicada's cry.", author: "Miyamoto Musashi" },
  { jp: "荒海や\n佐渡によこたふ\n天の川", en: "Rough sea —\nstretching out towards Sado,\nthe Milky Way.", author: "Matsuo Bashō" }
];
let currentHaiku = 0;
const haikuCard = document.querySelector('.haiku-card');

function showHaiku(index) {
  const jp = document.getElementById('haiku-jp');
  const en = document.getElementById('haiku-en');
  const author = document.getElementById('haiku-author');
  if (!jp || !en || !author) return;
  haikuCard.classList.remove('active');
  setTimeout(() => {
    jp.innerHTML = haikus[index].jp.replace(/\n/g, '<br>');
    en.textContent = haikus[index].en;
    author.textContent = `— ${haikus[index].author}`;
    haikuCard.classList.add('active');
  }, 100);
}
if (haikuCard) {
  showHaiku(0);
  setInterval(() => {
    currentHaiku = (currentHaiku + 1) % haikus.length;
    showHaiku(currentHaiku);
  }, 8000);
}

// ==================== INK BRUSH BACKGROUND ====================
(function() {
  const canvas = document.getElementById('ink-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  const strokes = [];

  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  const kanjiList = ['夢', '愛', '静', '禅', '侍', '刀', '雲', '風', '花', '空'];

  function createStroke() {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.8;
    const kanji = kanjiList[Math.floor(Math.random() * kanjiList.length)];
    strokes.push({
      x, y, kanji, alpha: 1,
      size: 20 + Math.random() * 30,
      rotation: (Math.random() - 0.5) * 0.5,
      life: 0,
      maxLife: 200 + Math.random() * 150
    });
  }

  function drawStroke(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.font = `${s.size}px "Noto Serif JP", serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * 0.15})`;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText(s.kanji, 0, 0);
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    if (Math.random() < 0.02) createStroke();
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      s.life++;
      const progress = s.life / s.maxLife;
      s.alpha = progress < 0.2 ? progress * 5 : (1 - progress) * 1.2;
      if (s.alpha < 0) s.alpha = 0;
      drawStroke(s);
      if (s.life >= s.maxLife) strokes.splice(i, 1);
    }
    requestAnimationFrame(animate);
  }
  setTimeout(animate, 1000);
})();
