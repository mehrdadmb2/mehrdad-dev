(() => {
  'use strict';

  const CONFIG = Object.freeze({
    githubUser: 'mehrdadmb2',
    githubApi: 'https://api.github.com',
    repoCacheKey: 'mehrdad-dev:github:v4',
    cacheTTL: 15 * 60 * 1000,
    perPage: 100,
    maxPages: 10,
    requestTimeout: 9000,
    featuredProjects: 6,
    featuredSites: 3
  });

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const formatNumber = value => new Intl.NumberFormat().format(Number(value || 0));
  const relativeDate = date => {
    if (!date) return '—';
    const t = new Date(date).getTime();
    if (!Number.isFinite(t)) return '—';
    const seconds = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (seconds < 60) return 'just now';
    const m = Math.floor(seconds / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
    return new Date(t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  };

  function toast(message, type='info') {
    const host = $('#toast-container'); if (!host) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fas ${type==='success'?'fa-circle-check':type==='error'?'fa-circle-exclamation':'fa-circle-info'}"></i><span>${escapeHTML(message)}</span>`;
    host.appendChild(el); requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),300); },2600);
  }

  function setTheme(theme) {
    document.documentElement.classList.toggle('light', theme === 'light');
    try { localStorage.setItem('mehrdad-dev:theme', theme); } catch (_) {}
    const b = $('#theme-toggle');
    if (b) { b.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'; b.setAttribute('aria-label', b.title); const i=b.querySelector('i'); if(i)i.className=theme==='light'?'fas fa-sun':'fas fa-moon'; }
  }

  function initTheme() {
    let stored=null; try{stored=localStorage.getItem('mehrdad-dev:theme');}catch(_){}
    const light=stored || (matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark');
    setTheme(light);
    $('#theme-toggle')?.addEventListener('click',()=>setTheme(document.documentElement.classList.contains('light')?'dark':'light'));
  }

  function initMatrixLoader(){
    const loader=$('#loader'); const canvas=$('#matrix-canvas'); const status=$('#loader-status'); const bar=$('#loader-progress-bar');
    if(!loader)return;
    let raf=0;
    let closed=false;
    const MIN_DURATION=3600;
    const started=performance.now();
    if(canvas?.getContext && !reducedMotion()){
      const ctx=canvas.getContext('2d');
      const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789{}[]<>/\|';
      let w=0,h=0,size=16,cols=0,drops=[];
      const resize=()=>{
        const d=Math.min(devicePixelRatio||1,2);
        w=canvas.width=Math.floor(innerWidth*d); h=canvas.height=Math.floor(innerHeight*d);
        canvas.style.width=`${innerWidth}px`; canvas.style.height=`${innerHeight}px`;
        size=Math.max(15,Math.floor(16*d)); cols=Math.ceil(w/size);
        drops=Array.from({length:cols},()=>Math.random()*-h/size);
      };
      const draw=()=>{
        ctx.fillStyle='rgba(2,8,16,.16)'; ctx.fillRect(0,0,w,h);
        ctx.font=`${size}px Share Tech Mono,monospace`;
        for(let i=0;i<cols;i++){
          const ch=chars[(Math.random()*chars.length)|0], x=i*size, y=drops[i]*size;
          ctx.fillStyle=i%21===0?'rgba(255,255,255,.96)':'rgba(34,211,238,.7)'; ctx.fillText(ch,x,y);
          if(y>h&&Math.random()>.955)drops[i]=Math.random()*-24;
          drops[i]+=.78;
        }
        raf=requestAnimationFrame(draw);
      };
      resize(); addEventListener('resize',resize,{passive:true}); draw();
    }
    let p=0,idx=0;
    const messages=['BOOT SEQUENCE // 01','MATRIX LINK // 02','LOADING CORE // 03','SYNCING GITHUB // 04','SYSTEM READY // 05'];
    const timer=setInterval(()=>{
      p=Math.min(100,p+4+Math.round(Math.random()*7));
      if(bar)bar.style.width=`${p}%`;
      while(idx<messages.length && p>=Math.round((idx+1)*20)){if(status)status.textContent=messages[idx];idx++;}
      if(p>=100)clearInterval(timer);
    },120);
    const close=()=>{
      if(closed)return;
      const elapsed=performance.now()-started;
      const wait=Math.max(0,MIN_DURATION-elapsed);
      setTimeout(()=>{
        if(closed)return; closed=true;
        if(bar)bar.style.width='100%'; if(status)status.textContent='ACCESS GRANTED // WELCOME';
        loader.classList.add('hidden'); document.body.classList.remove('loading');
        setTimeout(()=>loader.remove(),650); if(raf)cancelAnimationFrame(raf);
      },wait);
    };
    addEventListener('load',close,{once:true});
    setTimeout(close,6500);
    if(document.readyState==='complete')setTimeout(close,650);
  }
  function initGalaxy(){
    const field=$('#stars');
    if(field&&!reducedMotion()){
      const frag=document.createDocumentFragment(),count=Math.min(220,Math.max(90,Math.floor(innerWidth/7)));
      for(let i=0;i<count;i++){const s=document.createElement('span');s.className='galaxy-star';s.style.left=`${Math.random()*100}%`;s.style.top=`${Math.random()*100}%`;const z=`${(.6+Math.random()*2.4).toFixed(2)}px`;s.style.width=z;s.style.height=z;s.style.opacity=(.15+Math.random()*.75).toFixed(2);s.style.animationDelay=`${(Math.random()*5).toFixed(2)}s`;s.style.animationDuration=`${(2+Math.random()*4).toFixed(2)}s`;frag.appendChild(s);}field.appendChild(frag);
    }
    if(typeof THREE==='undefined'||reducedMotion())return;
    const canvas=$('#particle-canvas');if(!canvas)return;
    try{const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,1000);camera.position.z=30;const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight);const count=innerWidth<700?350:750,geo=new THREE.BufferGeometry(),pos=new Float32Array(count*3),col=new Float32Array(count*3);for(let i=0;i<count*3;i+=3){pos[i]=(Math.random()-.5)*85;pos[i+1]=(Math.random()-.5)*85;pos[i+2]=(Math.random()-.5)*50;const r=Math.random();if(r<.34){col[i]=.75;col[i+1]=.52;col[i+2]=.98;}else if(r<.68){col[i]=.13;col[i+1]=.83;col[i+2]=.93;}else{col[i]=.96;col[i+1]=.45;col[i+2]=.71;}}geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));const mat=new THREE.PointsMaterial({size:.15,vertexColors:true,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false});const pts=new THREE.Points(geo,mat);scene.add(pts);const loop=()=>{pts.rotation.x+=.00025;pts.rotation.y+=.00045;renderer.render(scene,camera);requestAnimationFrame(loop)};loop();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);},{passive:true});}catch(e){console.warn('Particles disabled',e);}
  }

  function initTravelAndBirthday(){
    const birthday=$('#birthday-star'); if(birthday){const birth=new Date(2001,9,13);const update=()=>{const now=new Date();let age=now.getFullYear()-birth.getFullYear();const md=now.getMonth()-birth.getMonth();if(md<0||(md===0&&now.getDate()<birth.getDate()))age--;let next=new Date(now.getFullYear(),birth.getMonth(),birth.getDate());if(next<now)next=new Date(now.getFullYear()+1,birth.getMonth(),birth.getDate());const days=Math.ceil((next-now)/86400000);birthday.dataset.tooltip=`${age} years old · ${days} days until birthday`;birthday.setAttribute('aria-label',`Birthday: ${age} years old, ${days} days until next birthday`);};update();setInterval(update,3600000);birthday.addEventListener('click',()=>toast(birthday.dataset.tooltip||'Birthday information'));}
    $$('.travel-float').forEach(x=>{x.addEventListener('click',()=>toast('A little travel energy for the portfolio ✈️'));});
  }

  function initNavigation(){
    const menu=$('#nav-links'),toggle=$('#mobile-menu-btn');if(!menu||!toggle)return;
    const setOpen=open=>{menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));const i=toggle.querySelector('i');if(i)i.className=open?'fas fa-xmark':'fas fa-bars';};
    toggle.addEventListener('click',()=>setOpen(!menu.classList.contains('open')));$$('#nav-links a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
    document.addEventListener('click',e=>{if(menu.classList.contains('open')&&!menu.contains(e.target)&&!toggle.contains(e.target))setOpen(false);});
    const links=$$('#nav-links a[href^="#"]'),sections=links.map(a=>$(a.getAttribute('href'))).filter(Boolean);if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`));}),{rootMargin:'-44% 0px -48% 0px'});sections.forEach(s=>io.observe(s));}
  }

  function initScroll(){const progress=$('#progress-bar'),top=$('#back-to-top');let busy=false;const u=()=>{const max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=`${max>0?scrollY/max*100:0}%`;if(top)top.classList.toggle('show',scrollY>550);busy=false;};addEventListener('scroll',()=>{if(!busy){requestAnimationFrame(u);busy=true;}},{passive:true});u();top?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));}

  function initTyping(){const el=$('.typing');if(!el)return;const words=['Embedded Developer','IoT Builder','Network Specialist','Python Developer','Automation Engineer','Open Source Enthusiast'];if(reducedMotion()){el.textContent=words[0];return;}let wi=0,ci=0,del=false;const tick=()=>{const w=words[wi];ci+=del?-1:1;el.textContent=w.slice(0,ci);let d=del?55:90;if(!del&&ci===w.length){del=true;d=1600;}else if(del&&ci===0){del=false;wi=(wi+1)%words.length;d=400;}setTimeout(tick,d)};tick();}

  async function fetchJSON(url,retries=1){for(let a=0;a<=retries;a++){const c=new AbortController(),timer=setTimeout(()=>c.abort(),CONFIG.requestTimeout);try{const r=await fetch(url,{signal:c.signal,headers:{Accept:'application/vnd.github+json'},cache:'no-store'});clearTimeout(timer);if(r.status===403||r.status===429)throw new Error('GitHub API rate limit reached');if(!r.ok)throw new Error(`GitHub request failed (${r.status})`);return await r.json();}catch(e){clearTimeout(timer);if(a>=retries)throw e;await sleep(650*(a+1));}}throw new Error('Request failed');}
  function readCache(stale=true){try{const raw=localStorage.getItem(CONFIG.repoCacheKey);if(!raw)return null;const p=JSON.parse(raw);if(!stale&&(!p.savedAt||Date.now()-p.savedAt>CONFIG.cacheTTL))return null;return p.value||null;}catch(_){return null;}}
  function writeCache(value){try{localStorage.setItem(CONFIG.repoCacheKey,JSON.stringify({savedAt:Date.now(),value}));}catch(_){} }

  let allRepos=[],allLiveSites=[];
  async function getRepos(){const fresh=readCache(false);if(fresh)return{repos:fresh,source:'cache'};const stale=readCache(true);try{const repos=[];for(let page=1;page<=CONFIG.maxPages;page++){const batch=await fetchJSON(`${CONFIG.githubApi}/users/${CONFIG.githubUser}/repos?per_page=${CONFIG.perPage}&page=${page}&sort=updated&direction=desc`);if(!Array.isArray(batch))throw new Error('Invalid repository response');repos.push(...batch);if(batch.length<CONFIG.perPage)break;}writeCache(repos);return{repos,source:'live'};}catch(e){if(stale)return{repos:stale,source:'stale-cache',error:e};throw e;}}

  function renderStats(user,repos,source){if($('#repoCount'))$('#repoCount').textContent=formatNumber(user?.public_repos??repos.length);if($('#followers'))$('#followers').textContent=formatNumber(user?.followers??0);if($('#starsCount'))$('#starsCount').textContent=formatNumber(repos.reduce((n,r)=>n+Number(r.stargazers_count||0),0));if($('#liveCount'))$('#liveCount').textContent=formatNumber(allLiveSites.length);if($('#github-status'))$('#github-status').textContent=source==='live'?'GitHub synchronized':source==='stale-cache'?'Using cached GitHub data':'Using local cache';if($('#github-updated'))$('#github-updated').textContent=`Updated ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;if($('#project-sync-label'))$('#project-sync-label').textContent=source==='live'?'Live GitHub data':'Cached GitHub data';if($('#site-sync-label'))$('#site-sync-label').textContent=`${allLiveSites.length} GitHub Pages discovered`;}
  function sortRepos(list,mode){const a=[...list];if(mode==='stars')return a.sort((x,y)=>y.stargazers_count-x.stargazers_count);if(mode==='forks')return a.sort((x,y)=>y.forks_count-x.forks_count);if(mode==='name')return a.sort((x,y)=>x.name.localeCompare(y.name));return a.sort((x,y)=>new Date(y.pushed_at||y.updated_at)-new Date(x.pushed_at||x.updated_at));}
  function repoText(r){return[r.name,r.description,r.language,...(r.topics||[])].filter(Boolean).join(' ').toLowerCase();}

  function createProjectCard(repo){const card=document.createElement('article');card.className='project-card tilt-card reveal';const tags=(repo.topics||[]).slice(0,5).map(t=>`<span>${escapeHTML(t)}</span>`).join('');card.innerHTML=`<div class="project-top"><div class="project-icon"><i class="fas fa-folder-open"></i></div><span class="project-star"><i class="fas fa-star"></i> ${formatNumber(repo.stargazers_count)}</span></div><h3>${escapeHTML(repo.name)}</h3><p>${escapeHTML(repo.description||'No description yet — open the repository for details.')}</p><div class="project-meta"><span><i class="fas fa-code"></i>${escapeHTML(repo.language||'Mixed')}</span><span><i class="fas fa-code-branch"></i>${formatNumber(repo.forks_count)}</span><span><i class="far fa-clock"></i>${relativeDate(repo.pushed_at||repo.updated_at)}</span></div>${tags?`<div class="project-tags">${tags}</div>`:''}<div class="project-actions"><a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Source</a>${repo.homepage?`<a href="${escapeHTML(repo.homepage)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Demo</a>`:''}</div>`;bindTilt(card);return card;}
  function renderProjects(){const container=$('#projects-container'),all=$('#all-projects-container');if(!container)return;const q=($('#project-search')?.value||'').trim().toLowerCase(),mode=$('#project-sort')?.value||'updated',filtered=sortRepos(q?allRepos.filter(r=>repoText(r).includes(q)):allRepos,mode);container.innerHTML='';filtered.slice(0,CONFIG.featuredProjects).forEach(r=>container.appendChild(createProjectCard(r)));if($('#project-summary'))$('#project-summary').textContent=`${Math.min(CONFIG.featuredProjects,filtered.length)} featured · ${filtered.length} matching · ${allRepos.length} total`;if(all){all.innerHTML='';filtered.forEach(r=>all.appendChild(createProjectCard(r)));}}

  function pageURL(repo){if(repo.homepage&&/^https:\/\//i.test(repo.homepage))return repo.homepage.replace(/\/$/,'');return repo.name.toLowerCase()===`${CONFIG.githubUser}.github.io`.toLowerCase()?`https://${CONFIG.githubUser}.github.io`:`https://${CONFIG.githubUser}.github.io/${repo.name}`;}
  function discoverSites(repos){return repos.filter(r=>!r.fork&&!r.archived&&(r.has_pages||(r.homepage&&/github\.io|pages\./i.test(r.homepage)))).sort((a,b)=>Number(b.has_pages)-Number(a.has_pages)||new Date(b.updated_at)-new Date(a.updated_at)).map(repo=>({repo,url:pageURL(repo)}));}
  function bindSitePreview(frame){if(!frame)return;const load=()=>{if(frame.dataset.loaded==='1')return;frame.dataset.loaded='1';const url=frame.dataset.siteUrl,name=frame.dataset.siteName||'Live site';frame.innerHTML='<div class="portal-loading"><span class="spinner"></span><span>Loading preview…</span></div>';setTimeout(()=>{const f=document.createElement('iframe');f.src=url;f.loading='lazy';f.referrerPolicy='strict-origin-when-cross-origin';f.title=`${name} live preview`;f.sandbox='allow-scripts allow-same-origin allow-forms allow-popups';f.addEventListener('error',()=>{frame.innerHTML='<div class="portal-placeholder"><i class="fas fa-triangle-exclamation"></i><strong>Preview unavailable</strong><span>Open the site directly.</span></div>';});frame.innerHTML='';frame.appendChild(f);},80);};if(!('IntersectionObserver'in window)){setTimeout(load,200);return;}const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){load();io.disconnect();}},{rootMargin:'350px'});io.observe(frame);}
  function createSiteCard(site,preview){const card=document.createElement('article');card.className='website-card glass-card tilt-card reveal';card.innerHTML=`<div class="portal-frame" data-site-url="${escapeHTML(site.url)}" data-site-name="${escapeHTML(site.repo.name)}"><div class="portal-placeholder"><i class="fas fa-globe"></i><strong>${escapeHTML(site.repo.name)}</strong><span>Preview loads when needed</span></div></div><div class="website-body"><div class="website-head"><h3 class="font-tech">${escapeHTML(site.repo.name)}</h3><span class="site-status live">GITHUB PAGES</span></div><p>${escapeHTML(site.repo.description||'Live project hosted with GitHub Pages.')}</p><div class="website-links"><a href="${escapeHTML(site.url)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Open site</a><a href="${escapeHTML(site.repo.html_url)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Repository</a></div></div>`;bindTilt(card);if(preview)bindSitePreview(card.querySelector('.portal-frame'));return card;}
  function renderSites(){const f=$('#websites-featured'),all=$('#all-sites-container');if(!f)return;f.innerHTML='';allLiveSites.slice(0,CONFIG.featuredSites).forEach(s=>f.appendChild(createSiteCard(s,true)));if(all){all.innerHTML='';allLiveSites.forEach(s=>all.appendChild(createSiteCard(s,false)));}if($('#all-sites-summary'))$('#all-sites-summary').textContent=`${allLiveSites.length} live site${allLiveSites.length===1?'':'s'} discovered automatically from GitHub.`;}

  function panel(openSel,panelSel,closeSel){const open=$(openSel),box=$(panelSel),close=$(closeSel);const set=v=>{if(!box)return;box.hidden=!v;if(open)open.setAttribute('aria-expanded',String(v));};open?.addEventListener('click',()=>set(box.hidden));close?.addEventListener('click',()=>set(false));}
  function initProjectControls(){ $('#project-search')?.addEventListener('input',renderProjects);$('#project-sort')?.addEventListener('change',renderProjects);panel('#show-all-projects','#all-projects-panel','#close-all-projects');panel('#show-all-sites','#all-sites-panel','#close-all-sites');$('#site-search')?.addEventListener('input',()=>{const q=$('#site-search').value.trim().toLowerCase();$$('#all-sites-container .website-card').forEach(x=>x.hidden=q&&!x.textContent.toLowerCase().includes(q));}); }

  function initCommandPalette(){
    const p=$('#command-palette'),openBtn=$('#palette-toggle'),closeBtn=$('#close-palette'),search=$('#palette-search'),list=$('#command-list');if(!p||!openBtn||!closeBtn||!search||!list)return;
    p.hidden=true;document.body.classList.remove('modal-open');
    const commands=[['Home','#home','fa-house'],['About','#about','fa-user'],['Education','#education','fa-graduation-cap'],['Skills','#skills','fa-microchip'],['Projects','#projects','fa-code'],['Live Websites','#websites','fa-globe'],['Extras','#extras','fa-wand-magic-sparkles'],['Donate','#donate','fa-gem'],['Contact','#contact','fa-envelope']];
    const render=q=>{list.innerHTML='';commands.filter(c=>!q||c[0].toLowerCase().includes(q.trim().toLowerCase())).forEach(([name,target,icon],i)=>{const b=document.createElement('button');b.type='button';b.className='command-item';b.innerHTML=`<span class="command-key">${String(i+1).padStart(2,'0')}</span><i class="fas ${icon}"></i><span>${escapeHTML(name)}</span><small>${target}</small>`;b.addEventListener('click',()=>{close();$(target)?.scrollIntoView({behavior:'smooth'});});list.appendChild(b);});};
    const open=()=>{p.hidden=false;document.body.classList.add('modal-open');render(search.value);setTimeout(()=>search.focus(),30);};
    const close=()=>{p.hidden=true;document.body.classList.remove('modal-open');search.value='';};
    openBtn.addEventListener('click',open);closeBtn.addEventListener('click',close);$('[data-close-palette]')?.addEventListener('click',close);search.addEventListener('input',()=>render(search.value));document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}if(e.key==='Escape'&&!p.hidden)close();});render('');
  }

  function bindTilt(el){if(!el||el.dataset.tiltBound==='1'||reducedMotion()||!matchMedia('(hover:hover)').matches)return;el.dataset.tiltBound='1';el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;el.style.setProperty('--mx',`${x}px`);el.style.setProperty('--my',`${y}px`);el.style.transform=`perspective(900px) rotateX(${((y/r.height)-.5)*-6}deg) rotateY(${((x/r.width)-.5)*8}deg) translateY(-5px)`;});el.addEventListener('pointerleave',()=>el.style.transform='');}
  function initInteractions(){ $$('.tilt-card,.glass-card,.skill-card,.edu-card,.donate-card,.contact-card').forEach(bindTilt);const cursor=$('#cursor');if(cursor&&matchMedia('(hover:hover)').matches&&!reducedMotion()){document.addEventListener('pointermove',e=>{cursor.style.left=`${e.clientX}px`;cursor.style.top=`${e.clientY}px`;cursor.style.opacity='1';});document.addEventListener('pointerover',e=>cursor.classList.toggle('hover',!!e.target.closest('a,button,.glass-card,.travel-float,.birthday-star-floating')));}else cursor?.remove();}
  function initSkills(){const bars=$$('.skill-fill'),run=b=>b.style.width=b.dataset.width||'0%';if(!('IntersectionObserver'in window)){bars.forEach(run);return;}const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){run(e.target);io.unobserve(e.target);}}),{threshold:.25});bars.forEach(b=>io.observe(b));}
  function initRoadmap(){const f=$('#road-fill'),c=$('#road-car'),p=$('#progress-percent'),r=$('#remaining-days');if(!f||!c||!p||!r)return;const s=new Date(2025,7,23),e=new Date(2027,4,23),n=new Date(),pc=Math.min(100,Math.max(0,(n-s)/(e-s)*100));f.style.width=`${pc}%`;c.style.left=`${pc}%`;p.textContent=`${Math.floor(pc)}%`;r.textContent=formatNumber(Math.max(0,Math.ceil((e-n)/86400000)));}
  function initMaps(){const d=$('#journey-details');if(!d)return;let loaded=false;d.addEventListener('toggle',async()=>{if(!d.open||loaded)return;loaded=true;try{if(!window.L){const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});}const locations=[['map-school',29.623503,52.475145,'Tohidi High School'],['map-uni',29.625778,52.493417,'Zand Institute'],['map-service',29.62875,51.64139,'Service Location']];locations.forEach(([id,lat,lng,label])=>{const el=$(`#${id}`);if(!el||el.dataset.ready)return;const map=L.map(el).setView([lat,lng],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);L.marker([lat,lng]).addTo(map).bindPopup(label);el.dataset.ready='1';setTimeout(()=>map.invalidateSize(),150);});}catch(_){toast('Map module could not be loaded.','error');}});}
  function initHaiku(){const jp=$('#haiku-jp'),en=$('#haiku-en'),a=$('#haiku-author');if(!jp||!en||!a)return;const hs=[{jp:'古池や\n蛙飛びこむ\n水の音',en:'Old pond —\na frog jumps in,\nsound of water.',a:'Matsuo Bashō'},{jp:'蛍の火や\n吹き消す風の\n恋しき',en:"Firefly's light —\nthe wind that blows it out\nis dear to me.",a:'Kobayashi Issa'},{jp:'我死なば\n筆を捨てよと\n蝉の声',en:'When I die,\nthrow away my brush —\nthe cicada’s cry.',a:'Miyamoto Musashi'},{jp:'荒海や\n佐渡によこたふ\n天の川',en:'Rough sea —\nstretching out towards Sado,\nthe Milky Way.',a:'Matsuo Bashō'}];let i=0;const show=()=>{jp.innerHTML=escapeHTML(hs[i].jp).replace(/\n/g,'<br>');en.textContent=hs[i].en;a.textContent=`— ${hs[i].a}`};show();if(!reducedMotion())setInterval(()=>{i=(i+1)%hs.length;show();},8000);}
  function initCopy(){ $$('[data-copy-target]').forEach(b=>b.addEventListener('click',async()=>{const t=$(`#${b.dataset.copyTarget}`);if(!t)return;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(t.textContent.trim());else{const x=document.createElement('textarea');x.value=t.textContent.trim();document.body.appendChild(x);x.select();document.execCommand('copy');x.remove();}const old=b.innerHTML;b.innerHTML='<i class="fas fa-check"></i> Copied';b.classList.add('copied');toast('Wallet address copied.','success');setTimeout(()=>{b.innerHTML=old;b.classList.remove('copied');},1800);}catch(_){toast('Copy failed. Please copy manually.','error');}})); $('#copy-profile')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('Mehrdad Behrouzi — Computer Engineer, IoT & Embedded Developer\nhttps://mehrdadmb2.github.io/mehrdad-dev/');toast('Profile link copied.','success');}catch(_){toast('Could not copy profile link.','error');}});}

  async function loadGithub(){const btn=$('#refresh-github');const run=async()=>{btn?.classList.add('spinning');try{const [{repos,source},user]=await Promise.all([getRepos(),fetchJSON(`${CONFIG.githubApi}/users/${CONFIG.githubUser}`)]);allRepos=repos.filter(r=>!r.private&&!r.archived);allLiveSites=discoverSites(allRepos);renderStats(user,allRepos,source);renderProjects();renderSites();}catch(e){console.warn(e);const stale=readCache(true);if(Array.isArray(stale)){allRepos=stale.filter(r=>!r.private&&!r.archived);allLiveSites=discoverSites(allRepos);renderStats(null,allRepos,'stale-cache');renderProjects();renderSites();}else{if($('#github-status'))$('#github-status').textContent='GitHub temporarily unavailable';toast('GitHub data could not be loaded. The rest of the site is still available.','error');}}finally{btn?.classList.remove('spinning');}};btn?.addEventListener('click',run);await run();}
  function initFooter(){if($('#current-year'))$('#current-year').textContent=new Date().getFullYear();}

  async function boot(){
    document.body.classList.add('loading');
    const safe=(fn)=>{try{fn();}catch(e){console.warn('Optional module error:',e);}};
    safe(initTheme);safe(initMatrixLoader);safe(initGalaxy);safe(initTravelAndBirthday);safe(initNavigation);safe(initScroll);safe(initTyping);safe(initProjectControls);safe(initCommandPalette);safe(initSkills);safe(initRoadmap);safe(initMaps);safe(initHaiku);safe(initCopy);safe(initInteractions);safe(initFooter);
    try{await loadGithub();}catch(e){console.warn(e);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
