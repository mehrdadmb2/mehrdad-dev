/* =========================================================
   MEHRDAD.DEV — LIVE HUB
   Read-only integrations: Open-Meteo, ArzPulse, PySmartHome-PC
   Uses local GitHub Pages snapshots first-class as fallbacks.
   No API keys, private tokens, LAN addresses or credentials.
   ========================================================= */
(() => {
  'use strict';

  const CONFIG = Object.freeze({
    timezone: 'Asia/Tehran',
    cacheKey: 'mehrdad-dev:live-hub:v2',
    weatherRefreshMs: 10 * 60 * 1000,
    marketRefreshMs: 5 * 60 * 1000,
    homeRefreshMs: 5 * 60 * 1000,
    requestTimeoutMs: 12000,
    staleAfterMs: { weather: 3 * 60 * 60 * 1000, market: 60 * 60 * 1000, home: 15 * 60 * 1000 }
  });

  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=29.5918&longitude=52.5837' +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m' +
    '&hourly=temperature_2m,weather_code,precipitation_probability' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' +
    '&timezone=Asia%2FTehran&forecast_days=3&wind_speed_unit=kmh';
  const FEEDS = {
    weather: {
      snapshot: './data/weather-shiraz.json',
      live: WEATHER_URL,
      interval: CONFIG.weatherRefreshMs,
      validate: value => !!(value && value.current && value.hourly && value.daily && value.current.temperature_2m != null && Number.isFinite(Number(value.current.temperature_2m)))
    },
    market: {
      snapshot: './data/arzpulse.json',
      live: 'https://raw.githubusercontent.com/mehrdadmb2/ArzPulse/main/docs/data/latest.json',
      interval: CONFIG.marketRefreshMs,
      validate: value => !!(value && value.prices && (value.dollarPrice != null || value.usdtPrice != null || value.prices.USDT?.lastPrice != null))
    },
    home: {
      snapshot: './data/smarthome.json',
      live: 'https://raw.githubusercontent.com/mehrdadmb2/PySmartHome-PC/main/data/status.json',
      interval: CONFIG.homeRefreshMs,
      validate: value => !!(value && value.nodes && typeof value.nodes === 'object')
    }
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const number = value => value === null || value === undefined || value === '' ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
  const fmt = (value, maximumFractionDigits = 1) => value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
  const fmtInteger = value => value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  const fmtTemp = value => value == null ? '—' : `${fmt(value, 1)}°`;
  const parseDate = value => {
    if (!value) return null;
    let normalized = value;
    // Open-Meteo returns local wall-clock strings without an offset.
    // Interpret those explicitly as Asia/Tehran so visitors abroad see correct freshness.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) normalized = `${value}+03:30`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const ageMs = value => {
    const date = parseDate(value);
    return date ? Math.max(0, Date.now() - date.getTime()) : null;
  };
  const relative = value => {
    const age = ageMs(value);
    if (age == null) return 'time unavailable';
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  const windCompass = degrees => {
    const value = number(degrees);
    if (value == null) return '';
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(value / 45) % 8];
  };
  const tehranTime = value => {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: CONFIG.timezone }).format(date) : '—';
  };
  const tehranDay = value => {
    if (!value) return '—';
    const date = parseDate(`${String(value).slice(0, 10)}T12:00:00+03:30`);
    return date ? new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: CONFIG.timezone }).format(date) : '—';
  };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const setText = (selector, value) => { const element = $(selector); if (element) element.textContent = value == null ? '—' : String(value); };
  const withCacheBuster = url => `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;

  let started = false;
  let sectionVisible = false;
  let refreshTimer = null;
  let weatherData = null;
  let weatherSceneOverride = 'live';
  const nextRefreshAt = { weather: 0, market: 0, home: 0 };
  const inFlight = { weather: false, market: false, home: false };
  const lastStates = { weather: null, market: null, home: null };
  const sceneClasses = ['s-clear', 's-partly', 's-cloudy', 's-fog', 's-drizzle', 's-rain', 's-sleet', 's-snow', 's-storm', 'd', 'n'];

  function readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CONFIG.cacheKey) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (_) { return {}; }
  }
  function writeCache(feed, raw, fetchedAt, source) {
    try {
      const cache = readCache();
      cache[feed] = { raw, fetchedAt: fetchedAt || new Date().toISOString(), source: source || 'cache', savedAt: Date.now() };
      localStorage.setItem(CONFIG.cacheKey, JSON.stringify(cache));
    } catch (_) { /* Private browsing / storage quota: live UI still works. */ }
  }

  async function fetchJSON(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
    try {
      const response = await fetch(withCacheBuster(url), {
        method: 'GET', cache: 'no-store', credentials: 'omit', signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  function unwrapSnapshot(envelope) {
    if (!envelope || typeof envelope !== 'object') return null;
    if (envelope.raw && typeof envelope.raw === 'object') {
      return { raw: envelope.raw, fetchedAt: envelope.fetchedAt || envelope.checkedAt || null, source: envelope.source || 'GitHub snapshot' };
    }
    return { raw: envelope, fetchedAt: null, source: 'GitHub snapshot' };
  }

  function weatherInfo(code) {
    if (code === null || code === undefined || code === '') return { label: 'Current conditions', emoji: '🌡️', scene: 's-cloudy' };
    const c = Number(code);
    if (!Number.isFinite(c)) return { label: 'Current conditions', emoji: '🌡️', scene: 's-cloudy' };
    if (c === 0) return { label: 'Clear sky', emoji: '☀️', scene: 's-clear' };
    if (c === 1) return { label: 'Mainly clear', emoji: '🌤️', scene: 's-clear' };
    if (c === 2) return { label: 'Partly cloudy', emoji: '⛅', scene: 's-partly' };
    if (c === 3) return { label: 'Overcast', emoji: '☁️', scene: 's-cloudy' };
    if (c === 45 || c === 48) return { label: 'Fog', emoji: '🌫️', scene: 's-fog' };
    if ([51, 53, 55].includes(c)) return { label: 'Drizzle', emoji: '🌦️', scene: 's-drizzle' };
    if ([56, 57, 66, 67].includes(c)) return { label: 'Freezing precipitation', emoji: '🌨️', scene: 's-sleet' };
    if ([61, 63, 65, 80, 81, 82].includes(c)) return { label: 'Rain', emoji: '🌧️', scene: 's-rain' };
    if ([71, 73, 75, 77, 85, 86].includes(c)) return { label: 'Snow', emoji: '❄️', scene: 's-snow' };
    if ([95, 96, 99].includes(c)) return { label: 'Thunderstorm', emoji: '⛈️', scene: 's-storm' };
    return { label: 'Current conditions', emoji: '🌡️', scene: 's-cloudy' };
  }

  function renderWeather(raw, meta = {}) {
    const current = raw?.current;
    if (!current) throw new Error('Weather response has no current conditions');
    weatherData = raw;
    const daily = raw.daily || {};
    const info = weatherInfo(current.weather_code);
    const isDay = Number(current.is_day) === 1;
    const low = number(daily.temperature_2m_min?.[0]);
    const high = number(daily.temperature_2m_max?.[0]);
    const chance = number(daily.precipitation_probability_max?.[0]);
    const uv = number(daily.uv_index_max?.[0]);
    const sunrise = daily.sunrise?.[0];
    const sunset = daily.sunset?.[0];

    setText('#lh-weather-condition', info.label);
    setText('#lh-weather-temp', fmt(current.temperature_2m, 1));
    setText('#lh-weather-feels', `Feels like ${fmtTemp(number(current.apparent_temperature))}`);
    setText('#lh-weather-hilo', `H ${fmtTemp(high)}  ·  L ${fmtTemp(low)}`);
    const humidity = number(current.relative_humidity_2m);
    const wind = number(current.wind_speed_10m);
    const windDirection = windCompass(current.wind_direction_10m);
    const precipitation = number(current.precipitation);
    setText('#lh-weather-humidity', humidity == null ? '—' : `${fmt(humidity, 0)}%`);
    setText('#lh-weather-wind', wind == null ? '—' : `${fmt(wind, 0)} km/h${windDirection ? ` · ${windDirection}` : ''}`);
    setText('#lh-weather-rain', chance == null ? (precipitation == null ? '—' : `${fmt(precipitation, 1)} mm`) : `${fmt(chance, 0)}%`);
    setText('#lh-weather-uv', fmt(uv, 1));
    setText('#lh-weather-sunrise', tehranTime(sunrise));
    setText('#lh-weather-sunset', tehranTime(sunset));
    const emoji = $('#lh-weather-emoji');
    if (emoji) emoji.textContent = info.emoji;

    const card = $('#lh-weather-card');
    if (card) applyWeatherScene(card, info.scene, isDay);
    renderHourly(raw);
    renderDaily(raw);
    const checked = current.time || meta.fetchedAt || null;
    setText('#lh-weather-updated', checked ? `Updated ${relative(checked)}` : 'Update time unavailable');
  }

  function renderHourly(raw) {
    const host = $('#lh-weather-hours');
    if (!host) return;
    const hourly = raw.hourly || {};
    const times = Array.isArray(hourly.time) ? hourly.time : [];
    if (!times.length) { host.innerHTML = '<div class="lh-empty">Hourly forecast is unavailable.</div>'; return; }
    const currentTime = String(raw.current?.time || '');
    let start = times.findIndex(time => String(time) >= currentTime);
    if (start < 0) start = 0;
    const indices = times.map((_, index) => index).slice(start, start + 7);
    host.innerHTML = indices.map(index => {
      const time = String(times[index] || '');
      const hour = time.slice(11, 16) || '—';
      const info = weatherInfo(hourly.weather_code?.[index]);
      const temp = number(hourly.temperature_2m?.[index]);
      const rain = number(hourly.precipitation_probability?.[index]);
      return `<div class="lh-hour"><time>${escapeHTML(hour)}</time><i aria-hidden="true">${info.emoji}</i><b>${temp == null ? '—' : `${fmt(temp, 0)}°`}</b><small>${rain == null ? '' : `${fmt(rain, 0)}%`}</small></div>`;
    }).join('');
  }

  function renderDaily(raw) {
    const host = $('#lh-weather-days');
    if (!host) return;
    const daily = raw.daily || {};
    const days = Array.isArray(daily.time) ? daily.time : [];
    if (!days.length) { host.innerHTML = ''; return; }
    host.innerHTML = days.slice(0, 3).map((day, index) => {
      const info = weatherInfo(daily.weather_code?.[index]);
      const max = number(daily.temperature_2m_max?.[index]);
      const min = number(daily.temperature_2m_min?.[index]);
      return `<div class="lh-day"><span class="lh-day-name">${index === 0 ? 'Today' : escapeHTML(tehranDay(day))}</span><span class="lh-day-icon" aria-hidden="true">${info.emoji}</span><b class="lh-day-temp">${max == null ? '—' : `${fmt(max, 0)}°`} / ${min == null ? '—' : `${fmt(min, 0)}°`}</b></div>`;
    }).join('');
  }

  function applyWeatherScene(card, scene, isDay) {
    const selected = weatherSceneOverride === 'live' ? scene : weatherSceneOverride;
    const phase = isDay ? 'd' : 'n';
    card.classList.remove(...sceneClasses);
    card.classList.add(selected, phase);
    card.dataset.scene = selected;
    card.dataset.phase = phase;
    const fx = $('#lh-weather-fx');
    if (!fx) return;
    const sceneKey = `${selected}:${phase}`;
    if (fx.dataset.sceneKey === sceneKey) return;
    fx.dataset.sceneKey = sceneKey;
    fx.replaceChildren();
    const append = (className, vars = {}) => {
      const element = document.createElement('span');
      element.className = className;
      Object.entries(vars).forEach(([key, value]) => element.style.setProperty(key, value));
      fx.appendChild(element);
    };
    const random = (min, max) => min + Math.random() * (max - min);
    if (phase === 'n') {
      append('lh-moon');
      for (let i = 0; i < 28; i++) append('lh-star', { '--x': `${random(4, 96)}%`, '--y': `${random(3, 62)}%`, '--duration': `${random(1.5, 4.5)}s`, '--delay': `${random(0, 3)}s` });
    } else if (selected === 's-clear' || selected === 's-partly') {
      append('lh-sun');
    }
    if (['s-partly', 's-cloudy', 's-fog', 's-drizzle', 's-rain', 's-sleet', 's-snow', 's-storm'].includes(selected)) {
      const count = selected === 's-partly' ? 2 : 4;
      for (let i = 0; i < count; i++) append('lh-cloud', {
        '--x': `${random(-10, 70)}%`, '--y': `${random(15, 50)}%`, '--width': `${random(105, 205)}px`,
        '--opacity': `${random(.13, .28)}`, '--duration': `${random(17, 31)}s`, '--delay': `${random(-15, 0)}s`
      });
    }
    if (selected === 's-fog') {
      for (let i = 0; i < 4; i++) append('lh-fog-band', { '--y': `${18 + i * 14}%`, '--duration': `${random(14, 24)}s`, '--delay': `${random(-10, 0)}s` });
    }
    if (['s-drizzle', 's-rain', 's-sleet', 's-storm'].includes(selected) && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const count = selected === 's-drizzle' ? 18 : selected === 's-storm' ? 42 : 34;
      for (let i = 0; i < count; i++) append('lh-rain-drop', { '--x': `${random(0, 100)}%`, '--duration': `${random(.65, 1.35)}s`, '--delay': `${random(-1.5, 0)}s` });
    }
    if (selected === 's-snow' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < 26; i++) append('lh-snow-flake', { '--x': `${random(0, 100)}%`, '--size': `${random(2, 5)}px`, '--duration': `${random(5, 11)}s`, '--delay': `${random(-10, 0)}s` });
    }
    if (selected === 's-storm') append('lh-lightning');
  }

  function percentText(value) {
    if (value == null) return 'Change unavailable';
    const sign = value > 0 ? '+' : '';
    return `${sign}${fmt(value, 2)}%`;
  }
  function setChange(selector, value) {
    const element = $(selector);
    if (!element) return;
    element.classList.remove('up', 'down', 'flat');
    const n = number(value);
    element.classList.add(n == null || n === 0 ? 'flat' : n > 0 ? 'up' : 'down');
    element.textContent = n == null ? 'Change unavailable' : `${n > 0 ? '▲' : n < 0 ? '▼' : '•'} ${percentText(n)}`;
  }
  function renderMarket(raw, meta = {}) {
    const prices = raw.prices || {};
    const usdt = prices.USDT || {};
    const btc = prices.BTC || {};
    const dollarRial = number(raw.dollarPrice ?? raw.usdtPrice ?? usdt.lastPrice);
    const goldRial = number(raw.gold18K);
    const btcRial = number(btc.lastPrice);
    setText('#lh-usd-price', dollarRial == null ? '—' : fmtInteger(dollarRial / 10));
    setText('#lh-gold-price', goldRial == null ? '—' : fmtInteger(goldRial / 10));
    setText('#lh-btc-price', btcRial == null ? '—' : fmtInteger(btcRial / 10));
    setChange('#lh-usd-change', number(raw.dollarChange ?? usdt.change));
    const sourceTime = raw.timestamp || usdt.fetchedAt || meta.fetchedAt || null;
    setText('#lh-market-updated', sourceTime ? `Market data ${relative(sourceTime)}` : 'Update time unavailable');
  }

  function renderHome(raw) {
    const host = $('#lh-home-nodes');
    if (!host) return;
    const entries = Object.entries(raw.nodes || {}).filter(([, node]) => node && typeof node === 'object');
    const online = entries.filter(([, node]) => node.online === true && (ageMs(node.last_seen) == null || ageMs(node.last_seen) <= CONFIG.staleAfterMs.home)).length;
    setText('#lh-home-count', `${online}/${entries.length}`);
    setText('#lh-home-count-note', entries.length ? 'sensors currently online' : 'no sensor records found');
    if (!entries.length) {
      host.innerHTML = '<div class="lh-empty">No sensor nodes are available in the latest public snapshot.</div>';
    } else {
      host.innerHTML = entries.map(([key, node]) => {
        const seenAge = ageMs(node.last_seen);
        const stale = seenAge != null && seenAge > CONFIG.staleAfterMs.home;
        const isOnline = node.online === true && !stale;
        const status = isOnline ? 'ONLINE' : stale ? 'STALE' : 'OFFLINE';
        const temperature = number(node.temperature);
        const humidity = number(node.humidity);
        const latency = number(node.latency_ms);
        const latencyLabel = latency == null ? '—' : latency >= 1000 ? `${fmt(latency / 1000, 2)} s` : `${fmt(latency, 0)} ms`;
        const name = escapeHTML(node.name || key.replace(/[_-]+/g, ' '));
        return `<article class="lh-node ${isOnline ? 'is-online' : stale ? 'is-stale' : 'is-offline'}">
          <div class="lh-node-head"><strong class="lh-node-name">${name}</strong><span class="lh-node-status"><i></i>${status}</span></div>
          <div class="lh-node-metrics">
            <div class="lh-node-metric"><b>${temperature == null ? '—' : `${fmt(temperature, 1)}°`}</b><span>Temperature</span></div>
            <div class="lh-node-metric"><b>${humidity == null ? '—' : `${fmt(humidity, 1)}%`}</b><span>Humidity</span></div>
          </div>
          <div class="lh-node-foot"><span>Latency ${latencyLabel}</span><span>${node.last_seen ? relative(node.last_seen) : 'No heartbeat'}</span></div>
        </article>`;
      }).join('');
    }
    const server = raw.server || {};
    setText('#lh-home-server-state', server.publish_ok === false ? 'Snapshot publish delayed' : 'Telemetry publisher ready');
    setText('#lh-home-updated', raw.generated_at ? `Sensor feed ${relative(raw.generated_at)}` : 'Sensor feed time unavailable');
  }

  function staleFor(feed, raw, meta) {
    if (feed === 'weather') {
      const time = raw.current?.time || meta.fetchedAt;
      const age = ageMs(time);
      return age != null && age > CONFIG.staleAfterMs.weather;
    }
    if (feed === 'market') {
      const usdt = raw.prices?.USDT || {};
      const age = ageMs(raw.timestamp || usdt.fetchedAt || meta.fetchedAt);
      return raw.derivedStale?.dollar === true || raw.derivedStale?.gold18K === true || usdt.stale === true || raw.prices?.BTC?.stale === true || (age != null && age > CONFIG.staleAfterMs.market);
    }
    if (feed === 'home') {
      const age = ageMs(raw.generated_at || meta.fetchedAt);
      return age != null && age > CONFIG.staleAfterMs.home;
    }
    return false;
  }

  function setFeedStatus(feed, source, stale) {
    const host = $(`#lh-${feed}-state`);
    if (!host) return;
    const label = stale ? 'STALE' : source === 'live' ? 'LIVE' : source === 'snapshot' ? 'SNAPSHOT' : source === 'cache' ? 'CACHED' : 'OFFLINE';
    host.classList.remove('is-live', 'is-stale', 'is-offline');
    host.classList.add(stale ? 'is-stale' : source === 'live' ? 'is-live' : source === 'offline' ? 'is-offline' : 'is-stale');
    const text = host.querySelector('span');
    if (text) text.textContent = label;
    lastStates[feed] = { source, stale, label };
    updateGlobalState();
  }

  function updateGlobalState() {
    const host = $('#lh-global-state');
    if (!host) return;
    const states = Object.values(lastStates).filter(Boolean);
    const liveCount = states.filter(state => state.source === 'live' && !state.stale).length;
    const text = host.querySelector('span');
    host.classList.remove('is-live', 'is-stale', 'is-offline');
    if (!states.length) {
      if (text) text.textContent = 'CONNECTING';
    } else if (states.length === 3 && states.every(state => state.source === 'offline')) {
      host.classList.add('is-offline');
      if (text) text.textContent = 'DATA OFFLINE';
    } else if (liveCount < 3) {
      host.classList.add('is-stale');
      if (text) text.textContent = `${liveCount}/3 LIVE`; 
    } else {
      host.classList.add('is-live');
      if (text) text.textContent = 'ALL FEEDS LIVE';
    }
  }

  function updateLastCheck() {
    const element = $('#lh-last-check');
    if (!element) return;
    element.textContent = `Checked ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: CONFIG.timezone }).format(new Date())} · Tehran`;
  }

  function applyFeed(feed, raw, meta) {
    const stale = staleFor(feed, raw, meta);
    if (feed === 'weather') renderWeather(raw, meta);
    if (feed === 'market') renderMarket(raw, meta);
    if (feed === 'home') renderHome(raw);
    setFeedStatus(feed, meta.source || 'cache', stale);
    writeCache(feed, raw, meta.fetchedAt || new Date().toISOString(), meta.source || 'cache');
    updateLastCheck();
  }

  async function refreshFeed(feed) {
    if (inFlight[feed]) return;
    inFlight[feed] = true;
    const config = FEEDS[feed];
    nextRefreshAt[feed] = Date.now() + config.interval;
    try {
      const [snapshotResult, liveResult] = await Promise.allSettled([
        fetchJSON(new URL(config.snapshot, document.baseURI).href),
        fetchJSON(config.live)
      ]);
      const snapshotEnvelope = snapshotResult.status === 'fulfilled' ? unwrapSnapshot(snapshotResult.value) : null;
      const snapshot = snapshotEnvelope && config.validate(snapshotEnvelope.raw) ? snapshotEnvelope : null;
      const live = liveResult.status === 'fulfilled' && config.validate(liveResult.value)
        ? { raw: liveResult.value, fetchedAt: new Date().toISOString(), source: 'live' }
        : null;

      if (live) {
        applyFeed(feed, live.raw, { source: 'live', fetchedAt: live.fetchedAt });
      } else if (snapshot) {
        applyFeed(feed, snapshot.raw, { source: 'snapshot', fetchedAt: snapshot.fetchedAt });
      } else {
        const cache = readCache()[feed];
        if (cache && config.validate(cache.raw)) {
          applyFeed(feed, cache.raw, { source: 'cache', fetchedAt: cache.fetchedAt || null });
        } else {
          setFeedStatus(feed, 'offline', true);
          const target = feed === 'weather' ? '#lh-weather-updated' : feed === 'market' ? '#lh-market-updated' : '#lh-home-updated';
          setText(target, 'Source temporarily unavailable');
        }
      }
    } catch (error) {
      console.warn(`[Live Hub] ${feed} refresh failed:`, error);
      const cache = readCache()[feed];
      if (cache && config.validate(cache.raw)) applyFeed(feed, cache.raw, { source: 'cache', fetchedAt: cache.fetchedAt || null });
      else setFeedStatus(feed, 'offline', true);
    } finally {
      inFlight[feed] = false;
      updateLastCheck();
    }
  }

  function renderStoredCache() {
    const cache = readCache();
    Object.keys(FEEDS).forEach(feed => {
      const item = cache[feed];
      if (!item || !FEEDS[feed].validate(item.raw)) return;
      try { applyFeed(feed, item.raw, { source: 'cache', fetchedAt: item.fetchedAt || null }); }
      catch (error) { console.warn(`[Live Hub] Cached ${feed} data could not be rendered:`, error); }
    });
  }

  async function refreshAll(force = false) {
    const button = $('#lh-refresh');
    if (button) { button.classList.add('is-busy'); button.setAttribute('aria-busy', 'true'); }
    const feeds = Object.keys(FEEDS).filter(feed => force || Date.now() >= nextRefreshAt[feed]);
    try { await Promise.all(feeds.map(refreshFeed)); }
    finally { if (button) { button.classList.remove('is-busy'); button.setAttribute('aria-busy', 'false'); } }
  }

  function initSceneControl() {
    const select = $('#lh-scene-preview');
    if (!select) return;
    select.addEventListener('change', () => {
      weatherSceneOverride = select.value;
      if (weatherData?.current) {
        const info = weatherInfo(weatherData.current.weather_code);
        applyWeatherScene($('#lh-weather-card'), info.scene, Number(weatherData.current.is_day) === 1);
      }
      const note = $('#lh-scene-note');
      if (note) note.textContent = select.value === 'live' ? 'Live scene' : 'Visual preview only';
    });
  }

  function initTiltHighlight() {
    const section = $('#live-hub');
    if (!section || !window.matchMedia?.('(hover: hover)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    section.addEventListener('pointermove', event => {
      const card = event.target.closest('.lh-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--lh-mx', `${Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100))}%`);
      card.style.setProperty('--lh-my', `${Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100))}%`);
    }, { passive: true });
  }

  function start() {
    if (started) return;
    started = true;
    renderStoredCache();
    initSceneControl();
    initTiltHighlight();
    $('#lh-refresh')?.addEventListener('click', () => {
      Object.keys(nextRefreshAt).forEach(key => { nextRefreshAt[key] = 0; });
      refreshAll(true);
    });
    refreshAll(true);
    refreshTimer = setInterval(() => {
      if (document.hidden || !sectionVisible) return;
      refreshAll(false);
    }, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshAll(false);
    });
    const scene = $('#lh-weather-card');
    if (scene && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries.some(entry => entry.isIntersecting);
        scene.classList.toggle('lh-paused', !visible);
      }, { threshold: 0.05 });
      observer.observe(scene);
    }
  }

  function boot() {
    const section = $('#live-hub');
    if (!section) return;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        sectionVisible = entries.some(entry => entry.isIntersecting);
        if (sectionVisible) start();
      }, { rootMargin: '260px 0px' });
      observer.observe(section);
    } else { sectionVisible = true; start(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
