// Loader
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 600);
  }
});

// Stars background (lightweight)
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

// Typing effect
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

// GitHub API (stats + projects)
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
        card.className = 'project-card glass-card';
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

// Military roadmap progress
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

// Back to top
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) backToTopBtn.classList.add('show');
  else backToTopBtn.classList.remove('show');
});
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Scroll reveal
const revealElements = document.querySelectorAll('.glass-card, .section-title');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.style.opacity = '1';
  });
}, { threshold: 0.1 });
revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.6s ease';
  revealObserver.observe(el);
});

// Skill bars
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

// Copy address
function copyAddress(elementId, btn) {
  const code = document.getElementById(elementId);
  if (!code) return;
  navigator.clipboard.writeText(code.textContent).then(() => {
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => alert('Copy failed'));
}

// Birthday star
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
