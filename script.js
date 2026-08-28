(() => {
  "use strict";

  const CONFIG = Object.freeze({
    githubUser: "mehrdadmb2",
    repoCacheKey: "mehrdad-dev:github:v3",
    siteCacheKey: "mehrdad-dev:pages:v1",
    cacheTtl: 15 * 60 * 1000,
    githubPerPage: 100,
    maxRepoPages: 10,
    requestTimeout: 9000,
    initialLiveSiteCount: 3,
    maxConcurrentSiteLoads: 2,
    githubApiBase: "https://api.github.com"
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
  const formatNumber = value => new Intl.NumberFormat().format(Number(value || 0));
  const relativeDate = dateString => {
    if (!dateString) return "—";
    const seconds = Math.round((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function setTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("mehrdad-dev:theme", theme);
    const icon = $("#theme-toggle i");
    if (icon) icon.className = theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  function initTheme() {
    const stored = localStorage.getItem("mehrdad-dev:theme");
    const preferred = window.matchMedia?.("(prefers-color-scheme: light)").matches;
    setTheme(stored || (preferred ? "light" : "dark"));
    $("#theme-toggle")?.addEventListener("click", () => {
      setTheme(document.documentElement.classList.contains("light") ? "dark" : "light");
    });
  }

  function initLoader() {
    window.addEventListener("load", () => {
      const loader = $("#page-loader");
      if (!loader) return;
      loader.classList.add("hidden");
      setTimeout(() => loader.remove(), 500);
    }, { once: true });
  }

  function initStars() {
    const field = $("#starfield");
    if (!field || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const count = Math.min(110, Math.floor(window.innerWidth / 12));
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = (Math.random() * .7 + .1).toFixed(2);
      star.style.animationDelay = `${Math.random() * 4}s`;
      star.style.animationDuration = `${2.5 + Math.random() * 3}s`;
      frag.appendChild(star);
    }
    field.appendChild(frag);
  }

  function initNavigation() {
    const menu = $("#site-menu");
    const toggle = $("#menu-toggle");
    if (!menu || !toggle) return;

    const setMenu = open => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      const icon = toggle.querySelector("i");
      if (icon) icon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    };

    toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    $$(".nav-link", menu).forEach(link => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("click", event => {
      if (!menu.classList.contains("open")) return;
      if (!menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
  }

  function initScrollUI() {
    const progress = $("#scroll-progress");
    const links = $$(".nav-link");
    const sections = links.map(link => $(link.getAttribute("href"))).filter(Boolean);

    let ticking = false;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      if (progress) progress.style.width = `${percent}%`;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-42% 0px -48% 0px", threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }

  function initTyping() {
    const el = $("#typing");
    if (!el) return;
    const words = [
      "Computer Engineer",
      "Embedded Developer",
      "IoT Builder",
      "Automation Engineer",
      "Python Developer",
      "Network Tinkerer"
    ];
    let wi = 0, ci = 0, deleting = false;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.textContent = words[0];
      return;
    }

    const tick = () => {
      const word = words[wi];
      ci += deleting ? -1 : 1;
      el.textContent = word.slice(0, ci);

      let delay = deleting ? 55 : 92;
      if (!deleting && ci === word.length) {
        deleting = true;
        delay = 1500;
      } else if (deleting && ci === 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        delay = 350;
      }
      setTimeout(tick, delay);
    };
    tick();
  }

  async function fetchJSON(url, { timeout = CONFIG.requestTimeout, retries = 1 } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept": "application/vnd.github+json" },
          cache: "no-store"
        });
        clearTimeout(timer);
        if (response.status === 403 || response.status === 429) {
          throw new Error("GitHub rate limit reached");
        }
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return await response.json();
      } catch (error) {
        clearTimeout(timer);
        if (attempt >= retries) throw error;
        await sleep(650 * (attempt + 1));
      }
    }
    throw new Error("Unexpected request failure");
  }

  function readCache(key, ttl = CONFIG.cacheTtl) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data?.savedAt || Date.now() - data.savedAt > ttl) return null;
      return data.value;
    } catch {
      return null;
    }
  }

  function readStaleCache(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw)?.value ?? null : null;
    } catch {
      return null;
    }
  }

  function writeCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value }));
    } catch {
      // Storage can fail in private browsing; the site still works without it.
    }
  }

  async function getGithubUser() {
    return fetchJSON(`${CONFIG.githubApiBase}/users/${CONFIG.githubUser}`);
  }

  async function getAllRepos() {
    const cached = readCache(CONFIG.repoCacheKey);
    if (cached) return cached;

    const repos = [];
    for (let page = 1; page <= CONFIG.maxRepoPages; page++) {
      const batch = await fetchJSON(
        `${CONFIG.githubApiBase}/users/${CONFIG.githubUser}/repos?per_page=${CONFIG.githubPerPage}&page=${page}&sort=updated`
      );
      if (!Array.isArray(batch)) throw new Error("Invalid repository response");
      repos.push(...batch);
      if (batch.length < CONFIG.githubPerPage) break;
    }
    writeCache(CONFIG.repoCacheKey, repos);
    return repos;
  }

  function updateGithubSnapshot(user, repos, liveSites, source) {
    $("#repo-count").textContent = formatNumber(user?.public_repos ?? repos.length);
    $("#followers").textContent = formatNumber(user?.followers ?? 0);
    $("#stars").textContent = formatNumber(repos.reduce((total, repo) => total + Number(repo.stargazers_count || 0), 0));
    $("#page-count").textContent = formatNumber(liveSites.length);
    $("#last-sync").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const state = $("#github-state");
    if (state) {
      state.textContent = source === "cache" ? "CACHED" : "ONLINE";
      state.className = `live-badge ${source === "cache" ? "pending" : "online"}`;
    }
  }

  function repoSearchText(repo) {
    return [
      repo.name, repo.full_name, repo.description, repo.language,
      ...(repo.topics || [])
    ].filter(Boolean).join(" ").toLowerCase();
  }

  let allRepos = [];
  let filteredRepos = [];

  function sortRepos(repos, mode) {
    const list = [...repos];
    if (mode === "stars") return list.sort((a,b) => b.stargazers_count - a.stargazers_count);
    if (mode === "forks") return list.sort((a,b) => b.forks_count - a.forks_count);
    if (mode === "name") return list.sort((a,b) => a.name.localeCompare(b.name));
    return list.sort((a,b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0));
  }

  function renderRepos() {
    const container = $("#projects-container");
    if (!container) return;

    const query = ($("#project-search")?.value || "").trim().toLowerCase();
    const sort = $("#project-sort")?.value || "updated";
    filteredRepos = sortRepos(
      query ? allRepos.filter(repo => repoSearchText(repo).includes(query)) : allRepos,
      sort
    );

    $("#project-summary").textContent =
      `${filteredRepos.length} shown · ${allRepos.length} public repositories · sorted by ${sort === "updated" ? "recent activity" : sort}`;

    container.innerHTML = "";
    $("#project-empty")?.classList.toggle("hidden", filteredRepos.length !== 0);

    const fragment = document.createDocumentFragment();
    filteredRepos.slice(0, 24).forEach(repo => {
      const card = document.createElement("article");
      card.className = "project-card";
      const tags = (repo.topics || []).slice(0, 6).map(topic => `<span>${escapeHTML(topic)}</span>`).join("");
      const language = repo.language ? escapeHTML(repo.language) : "Mixed";
      card.innerHTML = `
        <div class="project-top">
          <div class="project-icon"><i class="fa-regular fa-folder-open"></i></div>
          <span class="project-star"><i class="fa-solid fa-star"></i> ${formatNumber(repo.stargazers_count)}</span>
        </div>
        <h3>${escapeHTML(repo.name)}</h3>
        <p>${escapeHTML(repo.description || "No description yet — inspect the repository for details.")}</p>
        <div class="project-meta">
          <span><i class="fa-solid fa-code"></i> ${language}</span>
          <span><i class="fa-solid fa-code-branch"></i> ${formatNumber(repo.forks_count)}</span>
          <span><i class="fa-regular fa-clock"></i> ${relativeDate(repo.pushed_at)}</span>
        </div>
        ${tags ? `<div class="project-tags">${tags}</div>` : ""}
        <div class="project-actions">
          <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Source</a>
          ${repo.homepage ? `<a href="${escapeHTML(repo.homepage)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Demo</a>` : ""}
        </div>
      `;
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
  }

  function inferPagesUrl(repo) {
    const homepage = typeof repo.homepage === "string" ? repo.homepage.trim() : "";
    if (homepage && !homepage.includes("github.com")) return homepage;
    if (repo.name.toLowerCase() === `${CONFIG.githubUser.toLowerCase()}.github.io`) return `https://${CONFIG.githubUser}.github.io`;
    return `https://${CONFIG.githubUser}.github.io/${encodeURIComponent(repo.name)}`;
  }

  function isLikelyExternalUrl(url) {
    try {
      const u = new URL(url);
      return /^https?:$/.test(u.protocol);
    } catch {
      return false;
    }
  }

  function discoverLiveSites(repos) {
    return repos
      .filter(repo => repo.has_pages && !repo.archived)
      .map(repo => ({
        repoId: repo.id,
        repoName: repo.name,
        title: repo.name.replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()),
        description: repo.description || "GitHub Pages project",
        url: inferPagesUrl(repo),
        htmlUrl: repo.html_url,
        updatedAt: repo.pushed_at,
        language: repo.language || "Web",
        topics: repo.topics || [],
        hasPages: true
      }))
      .filter(site => isLikelyExternalUrl(site.url))
      .sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  function websiteCardTemplate(site, { preview = false } = {}) {
    const id = `site-${site.repoId}`;
    const safeTitle = escapeHTML(site.title);
    const safeDesc = escapeHTML(site.description);
    const tags = site.topics.slice(0, 3).map(topic => `<span>${escapeHTML(topic)}</span>`).join("");
    return `
      <article class="website-card glass" data-site-id="${site.repoId}">
        <div class="portal-frame" id="${id}-frame">
          ${preview ? `
            <div class="portal-loading" data-placeholder>
              <div class="spinner"></div>
              <span>Preparing preview…</span>
            </div>
          ` : `
            <div class="portal-placeholder" data-placeholder>
              <i class="fa-solid fa-globe"></i>
              <strong>${safeTitle}</strong>
              <span>Preview loads when it approaches the viewport.</span>
            </div>
          `}
        </div>
        <div class="website-body">
          <div class="website-head">
            <h3>${safeTitle}</h3>
            <span class="site-status unknown" data-status>READY</span>
          </div>
          <p>${safeDesc}</p>
          ${tags ? `<div class="project-tags">${tags}</div>` : ""}
          <div class="website-links">
            <a href="${escapeHTML(site.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open</a>
            <a href="${escapeHTML(site.htmlUrl)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Repo</a>
          </div>
        </div>
      </article>
    `;
  }

  const siteLoadState = new WeakSet();
  let siteObserver = null;

  function canEmbed(url) {
    try {
      const urlObj = new URL(url, location.href);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  function activateSitePreview(card) {
    if (!card || siteLoadState.has(card)) return;
    siteLoadState.add(card);

    const siteId = card.getAttribute("data-site-id");
    const site = liveSites.find(item => String(item.repoId) === String(siteId));
    const frame = $(".portal-frame", card);
    const placeholder = $("[data-placeholder]", card);
    if (!site || !frame || !canEmbed(site.url)) return;

    if (placeholder) {
      placeholder.innerHTML = `<div class="portal-loading"><div class="spinner"></div><span>Loading preview…</span></div>`;
    }

    const iframe = document.createElement("iframe");
    iframe.loading = "lazy";
    iframe.title = `${site.title} live preview`;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
    iframe.src = site.url;
    iframe.addEventListener("load", () => {
      placeholder?.remove();
      const status = $("[data-status]", card);
      if (status) {
        status.textContent = "LIVE";
        status.className = "site-status live";
      }
    }, { once: true });
    iframe.addEventListener("error", () => {
      placeholder?.remove();
      const status = $("[data-status]", card);
      if (status) {
        status.textContent = "CHECK SITE";
        status.className = "site-status unknown";
      }
    }, { once: true });
    frame.appendChild(iframe);
  }

  function installSiteObserver() {
    siteObserver?.disconnect();
    siteObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activateSitePreview(entry.target);
      });
    }, { rootMargin: "250px 0px", threshold: 0.01 });

    $$(".website-card").forEach(card => siteObserver.observe(card));
  }

  let liveSites = [];
  let visibleSites = [];

  function renderFeaturedSites() {
    const container = $("#featured-sites");
    const empty = $("#sites-empty");
    if (!container) return;

    visibleSites = liveSites.slice(0, CONFIG.initialLiveSiteCount);
    container.innerHTML = visibleSites.map(site => websiteCardTemplate(site, { preview: true })).join("");
    empty?.classList.toggle("hidden", liveSites.length !== 0);
    installSiteObserver();
  }

  function renderAllSites() {
    const container = $("#all-sites-grid");
    if (!container) return;
    const query = ($("#site-search")?.value || "").trim().toLowerCase();
    const list = liveSites.filter(site => {
      if (!query) return true;
      return `${site.title} ${site.description} ${site.language} ${site.topics.join(" ")}`.toLowerCase().includes(query);
    });

    $("#all-sites-count").textContent = formatNumber(list.length);
    container.innerHTML = list.map(site => websiteCardTemplate(site)).join("");
    installSiteObserver();
  }

  async function resolveCustomPageUrls() {
    // Only called after the user opens the full live-sites panel.
    // Small bounded concurrency prevents a burst of N requests.
    let next = 0;
    const workers = Array.from(
      { length: Math.min(CONFIG.maxConcurrentSiteLoads, liveSites.length) },
      async () => {
        while (true) {
          const index = next++;
          if (index >= liveSites.length) return;
          const site = liveSites[index];
          try {
            const pages = await fetchJSON(`${CONFIG.githubApiBase}/repos/${CONFIG.githubUser}/${encodeURIComponent(site.repoName)}/pages`, {
              timeout: 6000,
              retries: 0
            });
            if (pages?.html_url && isLikelyExternalUrl(pages.html_url)) site.url = pages.html_url;
            if (pages?.https_enforced && site.url.startsWith("http://")) site.url = site.url.replace(/^http:/, "https:");
          } catch {
            // Public API may reject some Pages endpoints. Keep inferred URL as fallback.
          }
        }
      }
    );
    await Promise.all(workers);
    writeCache(CONFIG.siteCacheKey, liveSites);
  }

  function initLiveSitesPanel() {
    const panel = $("#all-sites-panel");
    const openButton = $("#open-all-sites");

    const openPanel = () => {
      if (!panel) return;
      panel.open = true;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    openButton?.addEventListener("click", openPanel);

    panel?.addEventListener("toggle", async () => {
      if (!panel.open) return;
      openButton?.setAttribute("aria-expanded", "true");
      renderAllSites();
      $("#sites-status").textContent = `Found ${liveSites.length} GitHub Pages site${liveSites.length === 1 ? "" : "s"}. Resolving custom domains when available…`;
      await resolveCustomPageUrls();
      renderFeaturedSites();
      renderAllSites();
      $("#sites-status").textContent = `${liveSites.length} live site${liveSites.length === 1 ? "" : "s"} discovered automatically from repository metadata.`;
    }, { once: true });

    $("#site-search")?.addEventListener("input", renderAllSites);
  }

  function initProjectControls() {
    $("#project-search")?.addEventListener("input", renderRepos);
    $("#project-sort")?.addEventListener("change", renderRepos);

    $("#refresh-github")?.addEventListener("click", async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        localStorage.removeItem(CONFIG.repoCacheKey);
        localStorage.removeItem(CONFIG.siteCacheKey);
        await loadGithubData({ force: true });
        showToast("GitHub data refreshed.");
      } catch {
        showToast("GitHub refresh failed. Cached data may still be available.");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function loadGithubData({ force = false } = {}) {
    if (force) {
      localStorage.removeItem(CONFIG.repoCacheKey);
      localStorage.removeItem(CONFIG.siteCacheKey);
    }

    const summaryStatus = $("#sites-status");
    try {
      const [user, repos] = await Promise.all([getGithubUser(), getAllRepos()]);
      allRepos = repos.filter(repo => !repo.fork || repo.stargazers_count > 0);
      liveSites = discoverLiveSites(repos);

      writeCache(CONFIG.siteCacheKey, liveSites);
      renderRepos();
      renderFeaturedSites();
      updateGithubSnapshot(user, repos, liveSites, "network");
      if (summaryStatus) summaryStatus.textContent = `${liveSites.length} GitHub Pages site${liveSites.length === 1 ? "" : "s"} discovered automatically.`;
    } catch (error) {
      const cachedRepos = readStaleCache(CONFIG.repoCacheKey);
      const cachedSites = readStaleCache(CONFIG.siteCacheKey);

      if (Array.isArray(cachedRepos)) {
        allRepos = cachedRepos;
        liveSites = Array.isArray(cachedSites) ? cachedSites : discoverLiveSites(allRepos);
        renderRepos();
        renderFeaturedSites();
        updateGithubSnapshot(null, allRepos, liveSites, "cache");
        if (summaryStatus) summaryStatus.textContent = `Using cached GitHub data because the public API is unavailable right now.`;
        showToast("Offline/API fallback active.");
      } else {
        const state = $("#github-state");
        if (state) {
          state.textContent = "OFFLINE";
          state.className = "live-badge offline";
        }
        if (summaryStatus) summaryStatus.textContent = "GitHub data could not be loaded. Try Refresh later.";
        $("#project-summary").textContent = "GitHub API unavailable.";
      }
      console.warn("GitHub data load failed:", error);
    }
  }

  const quotes = [
    ["Build useful things. Make them reliable. Then make them beautiful.", "Personal principle"],
    ["The best automation is the one you forget is running.", "Automation mindset"],
    ["Hardware gives software a sense of physics.", "Embedded mindset"],
    ["Small tools compound into big workflows.", "Developer mindset"],
    ["Curiosity is a debugging technique.", "Personal principle"]
  ];
  let quoteIndex = 0;
  function initQuotes() {
    const next = $("#next-quote");
    const text = $("#quote-text");
    const author = $("#quote-author");
    const render = () => {
      text.textContent = quotes[quoteIndex][0];
      author.textContent = `— ${quotes[quoteIndex][1]}`;
    };
    render();
    next?.addEventListener("click", () => {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      render();
    });
  }

  function initSkillAnimation() {
    const tracks = $$(".skill-track span");
    if (!tracks.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        bar.style.width = bar.dataset.skill || "0%";
        observer.unobserve(bar);
      });
    }, { threshold: .35 });
    tracks.forEach(track => observer.observe(track));
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function initCopyButtons() {
    $$(".copy-address").forEach(button => {
      button.addEventListener("click", async () => {
        const target = $(`#${button.dataset.target}`);
        if (!target) return;
        const text = target.textContent.trim();
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const area = document.createElement("textarea");
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
          }
          const previous = button.textContent;
          button.textContent = "Copied ✓";
          setTimeout(() => button.textContent = previous, 1600);
          showToast("Address copied.");
        } catch {
          showToast("Copy failed. Please copy it manually.");
        }
      });
    });
  }

  function initFooter() {
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  async function boot() {
    initTheme();
    initLoader();
    initStars();
    initNavigation();
    initScrollUI();
    initTyping();
    initProjectControls();
    initLiveSitesPanel();
    initQuotes();
    initSkillAnimation();
    initCopyButtons();
    initFooter();

    await loadGithubData();
  }

  document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
