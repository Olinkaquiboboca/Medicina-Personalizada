/*
 * Catálogo de mídia sem backend.
 * Online: Cloudinary quando configurado.
 * Local/LAN: cópias empacotadas em media.
 * Não coloque API Key privada, API Secret ou tokens neste site.
 */
(async function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  // The script URL is always /<site-base>/assets/js/media-catalog.js, even when
  // this script is loaded by a nested page. Derive the GitHub Pages project base.
  const scriptUrl = document.currentScript && document.currentScript.src;
  const SITE_ROOT = scriptUrl ? new URL('../../', scriptUrl) : new URL('./', location.href);
  const localUrl = (path) => new URL(String(path || '').replace(/^\//, ''), SITE_ROOT).href;
  const text = (value, fallback = '') => (value == null || value === '' ? fallback : String(value));

  async function readJSON(path, fallback) {
    try {
      const response = await fetch(localUrl(path), { cache: 'no-cache' });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('[media-catalog]', error);
      return fallback;
    }
  }

  const [config, data, teamData, eventData] = await Promise.all([
    readJSON('data/site-config.json', { media: { mode: 'auto', cloudinary: { cloudName: '' } } }),
    readJSON('data/media.json', { gallery: [], videos: [] }),
    readJSON('data/team.json', { members: [] }),
    readJSON('data/event.json', {})
  ]);

  const hostname = location.hostname;
  const localHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' ||
    hostname.endsWith('.local') || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
  const requestedMode = new URLSearchParams(location.search).get('media');
  const configuredMode = config?.media?.mode || 'auto';
  const mode = requestedMode || (configuredMode === 'auto' ? (localHost ? 'offline' : 'online') : configuredMode);
  const offlinePreferred = mode === 'offline' || mode === 'local';
  const cloud = config?.media?.cloudinary || {};

  function safePublicId(id) {
    return String(id || '').split('/').map(encodeURIComponent).join('/');
  }

  function safeHttpsUrl(value) {
    if (!value) return '';
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' ? parsed.href : '';
    } catch (_) {
      return '';
    }
  }

  function safeLocalOrHttps(value) {
    if (!value) return '';
    const external = safeHttpsUrl(value);
    if (external) return external;
    const raw = String(value).trim();
    if (!raw || raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('\\')) return '';
    return localUrl(raw);
  }

  function cloudinaryUrl(record, kind, width = 1400) {
    const c = record?.cloudinary || {};
    const explicit = safeHttpsUrl(c.secureUrl);
    if (explicit) return explicit;
    if (!cloud.cloudName || !c.publicId) return '';

    const resource = c.resourceType || (kind === 'video' ? 'video' : 'image');
    const delivery = c.deliveryType || 'upload';
    const publicId = safePublicId(c.publicId);
    const version = c.version ? `v${String(c.version).replace(/^v/, '')}/` : '';

    if (kind === 'video') {
      const transform = c.transformation || cloud.videoTransformation || 'q_auto';
      const format = c.format || 'mp4';
      return `https://res.cloudinary.com/${encodeURIComponent(cloud.cloudName)}/${resource}/${delivery}/${transform}/${version}${publicId}.${format}`;
    }

    // f_auto e q_auto são componentes separados na URL de entrega Cloudinary.
    const transform = c.transformation || `${cloud.imageTransformation || 'c_limit'},w_${width}`;
    const autoFormatQuality = cloud.autoFormatQuality === false ? '' : '/f_auto/q_auto';
    return `https://res.cloudinary.com/${encodeURIComponent(cloud.cloudName)}/${resource}/${delivery}/${transform}${autoFormatQuality}/${version}${publicId}`;
  }

  function offlineUrl(record) {
    return record?.offline?.path || record?.offlinePath || '';
  }

  function resolveUrl(record, kind, width = 1400) {
    const local = safeLocalOrHttps(offlineUrl(record));
    const remote = cloudinaryUrl(record, kind, width);
    if (offlinePreferred) return local || remote;
    return remote || local;
  }

  function remoteIs(url) {
    return Boolean(url && url.startsWith('https://res.cloudinary.com/'));
  }

  function addCredit(parent, credit) {
    if (!credit) return;
    const p = document.createElement('p');
    p.className = 'media-credit';
    const label = typeof credit === 'string' ? credit : [credit.name, credit.license].filter(Boolean).join(' · ');
    p.textContent = label;
    if (typeof credit === 'object' && credit.url) {
      const a = document.createElement('a');
      a.href = safeHttpsUrl(credit.url) || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Fonte';
      a.style.marginLeft = '.4em';
      p.append(a);
    }
    parent.append(p);
  }

  function createGalleryCard(item) {
    const src = resolveUrl(item, 'image', 900);
    const full = resolveUrl(item, 'image', 2200);
    if (!src) return null;

    const article = document.createElement('article');
    article.className = 'media-card';
    const figure = document.createElement('figure');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-visual image-button';
    button.dataset.imageOpen = full || src;
    button.dataset.alt = text(item.alt, item.title);
    button.dataset.caption = text(item.caption, item.description);

    const img = document.createElement('img');
    img.src = src;
    img.alt = text(item.alt, item.title);
    img.loading = 'lazy';
    img.decoding = 'async';
    const local = offlineUrl(item);
    if (local && remoteIs(src)) {
      img.addEventListener('error', () => {
        const localAbsolute = localUrl(local);
        img.src = localAbsolute;
        button.dataset.imageOpen = localAbsolute;
      }, { once: true });
    }

    button.append(img);
    figure.append(button);
    const body = document.createElement('div');
    body.className = 'media-body';
    const h = document.createElement('h3');
    h.textContent = text(item.title, 'Imagem da feira');
    body.append(h);
    if (item.description) {
      const p = document.createElement('p');
      p.textContent = item.description;
      body.append(p);
    }
    addCredit(body, item.credit);
    article.append(figure, body);
    return article;
  }

  function createPoster(item) {
    if (item.poster) return resolveUrl(item.poster, 'image', 1200);
    const catalogPoster = item.posterCloudinary || item.posterOfflinePath
      ? { cloudinary: item.posterCloudinary || undefined, offline: { path: item.posterOfflinePath || '' } }
      : null;
    if (catalogPoster) return resolveUrl(catalogPoster, 'image', 1200);
    return safeLocalOrHttps(item.posterUrl);
  }

  function createVideoCard(item) {
    const src = resolveUrl(item, 'video', 1400);
    if (!src) return null;

    const article = document.createElement('article');
    article.className = 'media-card';
    const frame = document.createElement('div');
    frame.className = 'video-frame';
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', text(item.title, 'Vídeo da feira'));

    const poster = createPoster(item);
    if (poster) video.poster = poster;

    const source = document.createElement('source');
    source.src = src;
    source.type = item.mimeType || 'video/mp4';
    video.append(source);

    const local = offlineUrl(item);
    if (local && remoteIs(src)) {
      video.addEventListener('error', () => {
        source.src = localUrl(local);
        video.load();
      }, { once: true });
    }

    const captions = item.captions;
    if (captions?.url) {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.src = safeLocalOrHttps(captions.url);
      track.srclang = captions.srclang || 'pt-BR';
      track.label = captions.label || 'Português';
      if (captions.default === true) track.default = true;
      video.append(track);
    }

    frame.append(video);
    const body = document.createElement('div');
    body.className = 'media-body';
    const h = document.createElement('h3');
    h.textContent = text(item.title, 'Vídeo da equipe');
    body.append(h);
    if (item.description) {
      const p = document.createElement('p');
      p.textContent = item.description;
      body.append(p);
    }
    if (item.transcriptUrl) {
      const a = document.createElement('a');
      a.href = safeLocalOrHttps(item.transcriptUrl) || '#';
      a.textContent = 'Ler transcrição';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      body.append(a);
    }
    addCredit(body, item.credit);
    article.append(frame, body);
    return article;
  }

  function renderList(items, containerSelector, emptySelector, builder) {
    const container = $(containerSelector);
    const empty = $(emptySelector);
    if (!container) return;
    const published = (Array.isArray(items) ? items : [])
      .filter(x => x && x.published === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    let count = 0;
    for (const item of published) {
      const card = builder(item);
      if (card) { container.append(card); count++; }
    }
    if (empty) empty.hidden = count > 0;
  }

  renderList(data.gallery, '[data-gallery-grid]', '[data-gallery-empty]', createGalleryCard);
  renderList(data.videos, '[data-video-grid]', '[data-video-empty]', createVideoCard);

  const teamGrid = $('[data-team-grid]');
  const teamEmpty = $('[data-team-empty]');
  if (teamGrid) {
    const members = (Array.isArray(teamData.members) ? teamData.members : [])
      .filter(x => x && x.published === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const member of members) {
      const article = document.createElement('article');
      article.className = 'media-card team-member';
      const src = resolveUrl(member.photo || {}, 'image', 600);
      const visual = document.createElement('div');
      visual.className = 'media-visual team-avatar';
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = text(member.photo?.alt, `Fotografia de ${member.name}`);
        img.loading = 'lazy';
        img.decoding = 'async';
        const local = offlineUrl(member.photo || {});
        if (local && remoteIs(src)) img.addEventListener('error', () => { img.src = localUrl(local); }, { once: true });
        visual.append(img);
      } else {
        const initials = String(member.name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
        const span = document.createElement('span');
        span.textContent = initials || '?';
        span.setAttribute('aria-hidden', 'true');
        visual.append(span);
      }
      const body = document.createElement('div');
      body.className = 'media-body';
      const h = document.createElement('h3');
      h.textContent = text(member.name, 'Integrante da equipe');
      body.append(h);
      if (member.role) {
        const p = document.createElement('p');
        p.textContent = member.role;
        body.append(p);
      }
      article.append(visual, body);
      teamGrid.append(article);
    }
    if (teamEmpty) teamEmpty.hidden = teamGrid.children.length > 0;
  }

  if (eventData && Object.keys(eventData).length) {
    const name = $('[data-event-name]');
    if (name && eventData.name) name.textContent = eventData.name;
    document.querySelectorAll('[data-event-field]').forEach(node => {
      const key = node.dataset.eventField;
      const value = eventData[key];
      node.textContent = value ? String(value) : 'A confirmar';
    });
    const mapWrap = $('[data-map-wrap]');
    const mapLink = $('[data-map-link]');
    if (eventData.mapUrl && mapWrap && mapLink) {
      const safeMap = safeHttpsUrl(eventData.mapUrl);
      if (safeMap) { mapLink.href = safeMap; mapWrap.hidden = false; }
    }
  }
  document.documentElement.dataset.mediaMode = mode;
})();
