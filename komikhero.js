/* ============================================
   KomikHero — app.js
   MangaDex API Powered Manga/Manhwa Reader
   ============================================ */

// ─── MangaDex API (via Cloudflare Worker CORS Proxy) ──────
const PROXY_BASE = 'https://mangadex-proxy.hadesmailbox.workers.dev';
const API = {
    BASE: 'https://api.mangadex.org',
    COVER: 'https://uploads.mangadex.org/covers',
    lastRequest: 0,

    async _fetch(path, params = {}) {
        // Build URL through our CORS proxy
        const url = new URL(PROXY_BASE + path);
        Object.entries(params).forEach(([k, v]) => {
            if (Array.isArray(v)) v.forEach(val => url.searchParams.append(k, val));
            else if (v !== undefined && v !== null) url.searchParams.set(k, v);
        });
        // Rate limit: 5 req/s (generous for proxy)
        const now = Date.now();
        const wait = Math.max(0, 250 - (now - this.lastRequest));
        if (wait) await this.delay(wait);
        this.lastRequest = Date.now();
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
        return res.json();
    },

    delay(ms) { return new Promise(r => setTimeout(r, ms)); },

    async searchManga(query, { genre, sort = 'followedCount', page = 0, limit = 20 } = {}) {
        const params = {
            limit,
            offset: page * limit,
            'includes[]': ['cover_art'],
            'contentRating[]': ['safe', 'suggestive'],
        };
        if (query) params.title = query;
        if (genre) {
            // Need to resolve genre tag ID first
            const tags = await this._fetch('/manga/tag');
            const tag = tags.data.find(t => t.attributes.name.en?.toLowerCase() === genre.toLowerCase());
            if (tag) params['tags[]'] = [tag.id];
        }
        const orderMap = {
            followedCount: 'order[followedCount]=desc',
            latestUploadedChapter: 'order[latestUploadedChapter]=desc',
            rating: 'order[rating]=desc',
            title: 'order[title]=asc',
        };
        // We pass order via raw param
        params['order[' + Object.keys({ [sort]: 1 })[0] + ']'] = 'desc';
        // Actually let's just set it directly
        delete params['order[followedCount]'];
        params[`order[${sort}]`] = 'desc';
        return this._fetch('/manga', params);
    },

    async getPopularManga(limit = 20) {
        return this._fetch('/manga', {
            limit,
            'includes[]': ['cover_art'],
            'contentRating[]': ['safe', 'suggestive'],
            'order[followedCount]': 'desc',
        });
    },

    async getRecentManga(limit = 20) {
        return this._fetch('/manga', {
            limit,
            'includes[]': ['cover_art'],
            'contentRating[]': ['safe', 'suggestive'],
            'order[latestUploadedChapter]': 'desc',
        });
    },

    async getMangaDetail(id) {
        return this._fetch(`/manga/${id}`, {
            'includes[]': ['cover_art', 'author', 'artist'],
        });
    },

    async getMangaChapters(mangaId, lang = 'en') {
        return this._fetch(`/manga/${mangaId}/feed`, {
            'translatedLanguage[]': [lang],
            'order[chapter]': 'asc',
            limit: 500,
        });
    },

    async getChapterPages(chapterId) {
        return this._fetch(`/at-home/server/${chapterId}`);
    },

    extractCoverUrl(manga, size = '') {
        const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
        if (!coverRel) return '';
        const fileName = coverRel.attributes?.fileName;
        if (!fileName) return '';
        const suffix = size ? `.${size}.jpg` : '';
        return `${this.COVER}/${manga.id}/${fileName}${suffix}`;
    },

    extractTitle(manga) {
        const attr = manga.attributes;
        if (!attr) return 'Unknown';
        if (attr.title?.en) return attr.title.en;
        if (attr.altTitles) {
            const en = attr.altTitles.find(t => t.en);
            if (en) return en.en;
            const first = attr.altTitles[0];
            if (first) return Object.values(first)[0];
        }
        return Object.values(attr.title || {})[0] || 'Unknown';
    },

    extractDescription(manga) {
        const desc = manga.attributes?.description;
        if (!desc) return 'Tidak ada sinopsis.';
        return desc.en || Object.values(desc)[0] || 'Tidak ada sinopsis.';
    },

    extractGenres(manga) {
        return (manga.attributes?.tags || [])
            .filter(t => t.attributes?.group === 'genre')
            .map(t => t.attributes.name.en || Object.values(t.attributes.name)[0]);
    },

    extractThemes(manga) {
        return (manga.attributes?.tags || [])
            .filter(t => t.attributes?.group === 'theme')
            .map(t => t.attributes.name.en || Object.values(t.attributes.name)[0]);
    },

    getStatus(manga) {
        return manga.attributes?.status || 'unknown';
    },

    getYear(manga) {
        return manga.attributes?.year || '';
    },

    getAuthor(manga) {
        const rel = manga.relationships?.find(r => r.type === 'author');
        return rel?.attributes?.name || '';
    },

    getArtist(manga) {
        const rel = manga.relationships?.find(r => r.type === 'artist');
        return rel?.attributes?.name || '';
    },
};

// ─── State ───────────────────────────────────
const State = {
    currentPage: 'home',
    currentManga: null,
    currentChapter: null,
    chapters: [],
    bookmarks: [],
    history: [],
    theme: 'dark',
    searchQuery: '',
    selectedGenre: '',
    sortBy: 'followedCount',
    browsePage: 0,
    browseResults: [],
    heroManga: null,

    load() {
        try {
            this.bookmarks = JSON.parse(localStorage.getItem('kh_bookmarks') || '[]');
            this.history = JSON.parse(localStorage.getItem('kh_history') || '[]');
            this.theme = localStorage.getItem('kh_theme') || 'dark';
        } catch (e) { /* ignore */ }
    },

    saveBookmarks() {
        localStorage.setItem('kh_bookmarks', JSON.stringify(this.bookmarks));
    },

    saveHistory() {
        // Keep last 100
        if (this.history.length > 100) this.history = this.history.slice(0, 100);
        localStorage.setItem('kh_history', JSON.stringify(this.history));
    },

    saveTheme() {
        localStorage.setItem('kh_theme', this.theme);
    },

    toggleBookmark(mangaId) {
        const idx = this.bookmarks.indexOf(mangaId);
        if (idx >= 0) this.bookmarks.splice(idx, 1);
        else this.bookmarks.push(mangaId);
        this.saveBookmarks();
        return idx < 0; // true if added
    },

    isBookmarked(mangaId) {
        return this.bookmarks.includes(mangaId);
    },

    addHistory(mangaId, chapterId, title, chapterNum, coverUrl) {
        // Remove existing entry for same manga
        this.history = this.history.filter(h => h.mangaId !== mangaId);
        this.history.unshift({ mangaId, chapterId, title, chapterNum, coverUrl, timestamp: Date.now() });
        this.saveHistory();
    },
};

// ─── Router ──────────────────────────────────
function navigate(page, data) {
    State.currentPage = page;
    if (data?.manga) State.currentManga = data.manga;
    if (data?.chapter) State.currentChapter = data.chapter;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    renderCurrentPage();
    window.scrollTo(0, 0);
}

function renderCurrentPage() {
    const container = document.getElementById('app');
    switch (State.currentPage) {
        case 'home': renderHome(container); break;
        case 'browse': renderBrowse(container); break;
        case 'detail': renderDetail(container); break;
        case 'library': renderLibrary(container); break;
        default: renderHome(container);
    }
}

// ─── UI Helpers ──────────────────────────────
function mangaCardHTML(manga, index = 0) {
    const title = API.extractTitle(manga);
    const cover = API.extractCoverUrl(manga, '256');
    const genres = API.extractGenres(manga).slice(0, 2);
    const delay = index * 50;
    return `
        <div class="manga-card fade-in" style="animation-delay:${delay}ms" onclick="app.openDetail('${manga.id}')">
            <img class="manga-card__cover" src="${cover}" alt="${esc(title)}" loading="lazy"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 140 200%22><rect fill=%22%23222240%22 width=%22140%22 height=%22200%22/><text x=%2270%22 y=%22100%22 text-anchor=%22middle%22 fill=%22%23555%22 font-size=%2214%22>No Image</text></svg>'">
            <div class="manga-card__title">${esc(title)}</div>
            ${genres.length ? `<div class="manga-card__tags">${genres.map(g => `<span class="manga-card__tag">${esc(g)}</span>`).join('')}</div>` : ''}
        </div>
    `;
}

function loadingSkeleton(count = 6) {
    return Array.from({ length: count }, () => `
        <div class="skel-card">
            <div class="skel-card__cover skeleton"></div>
            <div class="skel-card__line skeleton" style="width:80%"></div>
            <div class="skel-card__line skel-card__line--short skeleton"></div>
        </div>
    `).join('');
}

function spinner() {
    return '<div class="loading-spinner"><div class="spinner"></div></div>';
}

function errorHTML(msg, retryFn) {
    return `
        <div class="error-msg">
            <div class="error-msg__icon">😵</div>
            <div class="error-msg__text">${esc(msg)}</div>
            ${retryFn ? `<button class="error-msg__btn" onclick="${retryFn}()">Coba Lagi</button>` : ''}
        </div>
    `;
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Page Renderers ──────────────────────────

async function renderHome(container) {
    container.innerHTML = `
        <div class="section" style="padding-top:16px">${spinner()}</div>
    `;

    try {
        const [popularRes, recentRes] = await Promise.all([
            API.getPopularManga(20),
            API.getRecentManga(20),
        ]);

        const popular = popularRes.data || [];
        const recent = recentRes.data || [];
        const heroManga = popular[Math.floor(Math.random() * Math.min(5, popular.length))] || popular[0];
        const aiPicks = popular.slice(0, 10);

        if (!heroManga) {
            container.innerHTML = errorHTML('Gagal memuat data. Periksa koneksi internet Anda.', 'app.navigate.bind(null,"home")');
            return;
        }

        const heroTitle = API.extractTitle(heroManga);
        const heroCover = API.extractCoverUrl(heroManga, '512');
        const heroCoverSm = API.extractCoverUrl(heroManga, '256');
        const heroGenres = API.extractGenres(heroManga).slice(0, 3);
        const heroDesc = API.extractDescription(heroManga);

        container.innerHTML = `
            <!-- Hero Banner -->
            <div class="hero" onclick="app.openDetail('${heroManga.id}')" style="cursor:pointer">
                <div class="hero__bg" style="background-image:url('${heroCover}')"></div>
                <div class="hero__gradient"></div>
                <div class="hero__content">
                    <img class="hero__cover" src="${heroCoverSm}" alt="${esc(heroTitle)}">
                    <div class="hero__info">
                        <div class="hero__title">${esc(heroTitle)}</div>
                        <div class="hero__meta">${esc(API.getAuthor(heroManga))} ${API.getYear(heroManga) ? '· ' + API.getYear(heroManga) : ''} · ${API.getStatus(heroManga)}</div>
                        <div class="hero__tags">${heroGenres.map(g => `<span class="manga-card__tag">${esc(g)}</span>`).join('')}</div>
                        <button class="hero__btn" onclick="event.stopPropagation();app.openDetail('${heroManga.id}')">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            Baca Sekarang
                        </button>
                    </div>
                </div>
            </div>

            <!-- AI Picks -->
            <div class="section">
                <div class="section__header">
                    <h2 class="section__title">🤖 Rekomendasi AI MiMo</h2>
                    <span class="section__link" onclick="app.navigate('browse')">Lihat Semua</span>
                </div>
                <div class="row-scroll" id="aiPicks">${aiPicks.map((m, i) => mangaCardHTML(m, i)).join('')}</div>
            </div>

            <!-- Popular -->
            <div class="section">
                <div class="section__header">
                    <h2 class="section__title">🔥 Populer Minggu Ini</h2>
                    <span class="section__link" onclick="app.navigate('browse')">Lihat Semua</span>
                </div>
                <div class="row-scroll" id="popularRow">${popular.slice(0, 15).map((m, i) => mangaCardHTML(m, i)).join('')}</div>
            </div>

            <!-- Recent -->
            <div class="section">
                <div class="section__header">
                    <h2 class="section__title">⏰ Terbaru Diperbarui</h2>
                    <span class="section__link" onclick="app.navigate('browse')">Lihat Semua</span>
                </div>
                <div class="row-scroll" id="recentRow">${recent.slice(0, 15).map((m, i) => mangaCardHTML(m, i)).join('')}</div>
            </div>
        `;
    } catch (e) {
        console.error('Home error:', e);
        container.innerHTML = errorHTML('Gagal memuat konten. Coba muat ulang halaman.', 'app.navigate.bind(null,"home")');
    }
}

async function renderBrowse(container) {
    const genres = ['', 'Action', 'Romance', 'Fantasy', 'Comedy', 'Horror', 'Sci-Fi', 'Drama', 'Slice of Life', 'Adventure', 'Supernatural', 'Mystery'];
    const sorts = [
        { value: 'followedCount', label: 'Populer' },
        { value: 'latestUploadedChapter', label: 'Terbaru' },
        { value: 'rating', label: 'Rating' },
        { value: 'title', label: 'A-Z' },
    ];

    container.innerHTML = `
        <input class="browse__search" type="text" id="browseSearch" placeholder="🔍  Cari manga, manhwa, manhua..." value="${esc(State.searchQuery)}">
        <div class="genre-tabs" id="genreTabs">
            ${genres.map(g => `<button class="genre-tab ${State.selectedGenre === g ? 'active' : ''}" data-genre="${esc(g)}">${g || 'Semua'}</button>`).join('')}
        </div>
        <div class="sort-row">
            <span class="sort-label">Urutkan:</span>
            <select class="sort-select" id="sortSelect">
                ${sorts.map(s => `<option value="${s.value}" ${State.sortBy === s.value ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
        </div>
        <div class="browse__grid-wrap">
            <div class="manga-grid" id="browseGrid">${loadingSkeleton(12)}</div>
        </div>
        <div class="load-more-wrap" id="loadMoreWrap" style="display:none">
            <button class="load-more-btn" id="loadMoreBtn">Muat Lebih Banyak</button>
        </div>
    `;

    // Bind events
    const searchEl = document.getElementById('browseSearch');
    searchEl.addEventListener('input', debounce(() => {
        State.searchQuery = searchEl.value.trim();
        State.browsePage = 0;
        State.browseResults = [];
        doBrowseSearch();
    }, 500));

    document.getElementById('genreTabs').addEventListener('click', (e) => {
        const btn = e.target.closest('.genre-tab');
        if (!btn) return;
        document.querySelectorAll('.genre-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.selectedGenre = btn.dataset.genre;
        State.browsePage = 0;
        State.browseResults = [];
        doBrowseSearch();
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
        State.sortBy = e.target.value;
        State.browsePage = 0;
        State.browseResults = [];
        doBrowseSearch();
    });

    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
        State.browsePage++;
        doBrowseSearch(true);
    });

    doBrowseSearch();
}

async function doBrowseSearch(append = false) {
    const grid = document.getElementById('browseGrid');
    if (!append) grid.innerHTML = loadingSkeleton(12);

    try {
        const res = await API.searchManga(State.searchQuery, {
            genre: State.selectedGenre,
            sort: State.sortBy,
            page: State.browsePage,
            limit: 20,
        });

        const manga = res.data || [];
        if (append) State.browseResults.push(...manga);
        else State.browseResults = manga;

        grid.innerHTML = State.browseResults.length
            ? State.browseResults.map((m, i) => mangaCardHTML(m, i)).join('')
            : '<div class="error-msg"><div class="error-msg__icon">📭</div><div class="error-msg__text">Tidak ditemukan manga yang cocok.</div></div>';

        const loadMoreWrap = document.getElementById('loadMoreWrap');
        if (loadMoreWrap) {
            const total = res.total || 0;
            loadMoreWrap.style.display = State.browseResults.length < total ? 'block' : 'none';
        }
    } catch (e) {
        console.error('Browse error:', e);
        grid.innerHTML = errorHTML('Gagal memuat data. Coba lagi.', 'app._retryBrowse');
    }
}

async function renderDetail(container) {
    if (!State.currentManga) {
        container.innerHTML = errorHTML('Manga tidak ditemukan.');
        return;
    }

    const mangaId = State.currentManga.id;
    container.innerHTML = spinner();

    try {
        const [detailRes, chaptersRes] = await Promise.all([
            API.getMangaDetail(mangaId),
            API.getMangaChapters(mangaId),
        ]);

        const manga = detailRes.data;
        State.currentManga = manga;
        const chapters = chaptersRes.data || [];
        State.chapters = chapters;

        const title = API.extractTitle(manga);
        const cover = API.extractCoverUrl(manga, '512');
        const coverSm = API.extractCoverUrl(manga, '256');
        const genres = API.extractGenres(manga);
        const themes = API.extractThemes(manga);
        const author = API.getAuthor(manga);
        const artist = API.getArtist(manga);
        const status = API.getStatus(manga);
        const year = API.getYear(manga);
        const desc = API.extractDescription(manga);
        const isBM = State.isBookmarked(mangaId);

        const statusClass = status === 'ongoing' ? 'ongoing' : 'completed';
        const statusLabel = { ongoing: 'Berlanjut', completed: 'Selesai', hiatus: 'Hiatus', cancelled: 'Dibatalkan' }[status] || status;

        container.innerHTML = `
            <div class="detail">
                <div class="detail__hero fade-in">
                    <img class="detail__cover" src="${cover}" alt="${esc(title)}" onerror="this.src='${coverSm}'">
                    <div class="detail__info">
                        <h1 class="detail__title">${esc(title)}</h1>
                        ${author ? `<div class="detail__meta">✍️ ${esc(author)}${artist && artist !== author ? ' · 🎨 ' + esc(artist) : ''}</div>` : ''}
                        ${year ? `<div class="detail__meta">📅 ${year}</div>` : ''}
                        <span class="detail__status detail__status--${statusClass}">${statusLabel}</span>
                        <div class="detail__tags">
                            ${[...genres, ...themes].map(g => `<span class="detail__tag">${esc(g)}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="detail__actions">
                    <button class="detail__btn detail__btn--primary" onclick="app.startReading('${mangaId}')">
                        ▶ Mulai Baca
                    </button>
                    <button class="detail__btn detail__btn--secondary ${isBM ? 'detail__btn--bookmarked' : ''}" id="bookmarkBtn" onclick="app.toggleBookmark('${mangaId}')">
                        ${isBM ? '❤️ Tersimpan' : '🤍 Simpan'}
                    </button>
                </div>

                <div class="detail__desc">
                    <div class="detail__desc-title">Sinopsis</div>
                    ${esc(desc)}
                </div>

                <div class="detail__chapters">
                    <div class="detail__desc-title">Daftar Chapter (${chapters.length})</div>
                    <div class="chapter-list">
                        ${chapters.length ? chapters.map((ch, i) => {
                            const chNum = ch.attributes.chapter || '?';
                            const chTitle = ch.attributes.title || '';
                            const chDate = formatDate(ch.attributes.publishAt);
                            const isRead = State.history.some(h => h.chapterId === ch.id);
                            return `
                                <div class="chapter-item ${isRead ? 'read' : ''}" onclick="app.readChapter('${mangaId}', '${ch.id}', ${i})">
                                    <span class="chapter-item__num">Ch. ${esc(chNum)}</span>
                                    <span class="chapter-item__title">${esc(chTitle)}</span>
                                    <span class="chapter-item__date">${chDate}</span>
                                </div>
                            `;
                        }).join('') : '<div class="error-msg"><div class="error-msg__text">Belum ada chapter tersedia dalam bahasa Inggris.</div></div>'}
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error('Detail error:', e);
        container.innerHTML = errorHTML('Gagal memuat detail manga.', 'app._retryDetail');
    }
}

async function renderLibrary(container) {
    const bmCount = State.bookmarks.length;
    const histCount = State.history.length;
    const readCount = new Set(State.history.map(h => h.mangaId)).size;

    // Build bookmark cards
    const bmHTML = State.bookmarks.length
        ? `<div class="manga-grid" id="bmGrid">${loadingSkeleton(Math.min(6, State.bookmarks.length))}</div>`
        : '<div class="library__empty"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><p>Belum ada manga tersimpan</p></div>';

    const histHTML = State.history.length
        ? State.history.slice(0, 50).map(h => `
            <div class="history-item" onclick="app.openDetail('${h.mangaId}')">
                <img class="history-item__cover" src="${h.coverUrl || ''}" alt="" loading="lazy"
                     onerror="this.style.display='none'">
                <div class="history-item__info">
                    <div class="history-item__title">${esc(h.title || 'Unknown')}</div>
                    <div class="history-item__chapter">Chapter ${esc(h.chapterNum || '?')}</div>
                    <div class="history-item__time">${timeAgo(h.timestamp)}</div>
                </div>
            </div>
        `).join('')
        : '<div class="library__empty"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>Belum ada riwayat baca</p></div>';

    container.innerHTML = `
        <div class="library">
            <div class="library__stats fade-in">
                <div class="stat-card"><div class="stat-card__num">${readCount}</div><div class="stat-card__label">Dibaca</div></div>
                <div class="stat-card"><div class="stat-card__num">${bmCount}</div><div class="stat-card__label">Tersimpan</div></div>
                <div class="stat-card"><div class="stat-card__num">${histCount}</div><div class="stat-card__label">Chapter</div></div>
            </div>
            <div class="library__tabs">
                <button class="library__tab active" data-tab="bookmarks">Tersimpan</button>
                <button class="library__tab" data-tab="history">Riwayat</button>
            </div>
            <div id="libBookmarks">${bmHTML}</div>
            <div id="libHistory" style="display:none">${histHTML}</div>
        </div>
    `;

    // Tab switching
    container.querySelector('.library__tabs').addEventListener('click', (e) => {
        const btn = e.target.closest('.library__tab');
        if (!btn) return;
        container.querySelectorAll('.library__tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('libBookmarks').style.display = tab === 'bookmarks' ? 'block' : 'none';
        document.getElementById('libHistory').style.display = tab === 'history' ? 'block' : 'none';
    });

    // Load bookmark covers
    if (State.bookmarks.length) {
        loadBookmarkCovers();
    }
}

async function loadBookmarkCovers() {
    const grid = document.getElementById('bmGrid');
    if (!grid) return;
    const cards = [];
    for (const id of State.bookmarks.slice(0, 30)) {
        try {
            const res = await API.getMangaDetail(id);
            cards.push(mangaCardHTML(res.data));
        } catch {
            cards.push(`<div class="manga-card" onclick="app.openDetail('${id}')"><div class="manga-card__cover skeleton" style="height:200px"></div><div class="manga-card__title">...</div></div>`);
        }
    }
    grid.innerHTML = cards.join('') || '<div class="library__empty"><p>Tidak ada data tersimpan</p></div>';
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam lalu`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} hari lalu`;
    return formatDate(new Date(ts).toISOString());
}

// ─── Reader ──────────────────────────────────
async function openReader(mangaId, chapterId, chapterIndex) {
    const overlay = document.getElementById('readerOverlay');
    const content = document.getElementById('readerContent');
    const titleEl = document.getElementById('readerTitle');
    const chapterEl = document.getElementById('readerChapter');
    const toolbar = document.getElementById('readerToolbar');
    const progress = document.getElementById('readerProgress');

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    content.innerHTML = spinner();
    toolbar.classList.remove('hidden');
    progress.style.width = '0%';

    const manga = State.currentManga;
    const chapter = State.chapters[chapterIndex];

    if (!chapter) {
        content.innerHTML = errorHTML('Chapter tidak ditemukan.');
        return;
    }

    State.currentChapter = { ...chapter, index: chapterIndex };
    const chNum = chapter.attributes.chapter || '?';
    const chTitle = chapter.attributes.title || '';
    const mangaTitle = API.extractTitle(manga);

    titleEl.textContent = mangaTitle;
    chapterEl.textContent = `Chapter ${chNum}${chTitle ? ' — ' + chTitle : ''}`;

    // Save to history
    const coverUrl = API.extractCoverUrl(manga, '256');
    State.addHistory(mangaId, chapter.id, mangaTitle, chNum, coverUrl);

    // Update nav buttons
    const prevBtn = document.getElementById('prevChapter');
    const nextBtn = document.getElementById('nextChapter');
    prevBtn.disabled = chapterIndex <= 0;
    nextBtn.disabled = chapterIndex >= State.chapters.length - 1;

    try {
        const pagesRes = await API.getChapterPages(chapter.id);
        const baseUrl = pagesRes.baseUrl;
        const hash = pagesRes.chapter?.hash;
        const filenames = pagesRes.chapter?.data || []; // high quality

        if (!filenames.length) {
            content.innerHTML = errorHTML('Halaman tidak ditemukan.');
            return;
        }

        content.innerHTML = filenames.map((fn, i) => {
            const url = `${baseUrl}/data/${hash}/${fn}`;
            return `<img src="${url}" alt="Halaman ${i + 1}" loading="lazy" style="min-height:200px">`;
        }).join('');

        // Scroll progress tracking
        content.onscroll = () => {
            const scrollTop = content.scrollTop;
            const scrollHeight = content.scrollHeight - content.clientHeight;
            const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progress.style.width = pct + '%';
        };

    } catch (e) {
        console.error('Reader error:', e);
        content.innerHTML = errorHTML('Gagal memuat halaman chapter.');
    }
}

function closeReader() {
    document.getElementById('readerOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// ─── App Object (Public API) ─────────────────
const app = {
    navigate,
    init,

    openDetail(mangaId) {
        // We need to get manga data first
        const cached = State.currentManga?.id === mangaId ? State.currentManga : null;
        if (cached) {
            navigate('detail', { manga: cached });
        } else {
            // Fetch minimal data for navigation
            API.getMangaDetail(mangaId).then(res => {
                navigate('detail', { manga: res.data });
            }).catch(() => {
                showToast('Gagal memuat detail manga');
            });
        }
    },

    readChapter(mangaId, chapterId, chapterIndex) {
        openReader(mangaId, chapterId, chapterIndex);
    },

    startReading(mangaId) {
        if (State.chapters.length) {
            openReader(mangaId, State.chapters[0].id, 0);
        } else {
            showToast('Belum ada chapter tersedia');
        }
    },

    toggleBookmark(mangaId) {
        const added = State.toggleBookmark(mangaId);
        const btn = document.getElementById('bookmarkBtn');
        if (btn) {
            btn.innerHTML = added ? '❤️ Tersimpan' : '🤍 Simpan';
            btn.classList.toggle('detail__btn--bookmarked', added);
        }
        showToast(added ? 'Ditambahkan ke koleksi' : 'Dihapus dari koleksi');
    },

    _retryBrowse() { doBrowseSearch(); },
    _retryDetail() { renderDetail(document.getElementById('app')); },
};

// ─── Init ────────────────────────────────────
function init() {
    State.load();
    applyTheme();

    // Search toggle
    document.getElementById('searchToggle').addEventListener('click', () => {
        const bar = document.getElementById('searchBar');
        bar.classList.toggle('open');
        if (bar.classList.contains('open')) {
            document.getElementById('searchInput').focus();
        }
    });

    document.getElementById('searchClose').addEventListener('click', () => {
        document.getElementById('searchBar').classList.remove('open');
    });

    // Header search
    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        const q = e.target.value.trim();
        if (q.length >= 2) {
            State.searchQuery = q;
            navigate('browse');
            // The browse page will pick up State.searchQuery
        }
    }, 600));

    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (q) {
                State.searchQuery = q;
                navigate('browse');
            }
        }
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        State.theme = State.theme === 'dark' ? 'light' : 'dark';
        State.saveTheme();
        applyTheme();
    });

    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'browse') {
                State.searchQuery = '';
                State.selectedGenre = '';
                State.browsePage = 0;
            }
            navigate(page);
        });
    });

    // Reader controls
    document.getElementById('readerBack').addEventListener('click', closeReader);

    document.getElementById('prevChapter').addEventListener('click', () => {
        if (State.currentChapter && State.currentChapter.index > 0) {
            const newIdx = State.currentChapter.index - 1;
            const ch = State.chapters[newIdx];
            openReader(State.currentManga.id, ch.id, newIdx);
        }
    });

    document.getElementById('nextChapter').addEventListener('click', () => {
        if (State.currentChapter && State.currentChapter.index < State.chapters.length - 1) {
            const newIdx = State.currentChapter.index + 1;
            const ch = State.chapters[newIdx];
            openReader(State.currentManga.id, ch.id, newIdx);
        }
    });

    // Reader toolbar auto-hide
    let hideTimer;
    const readerContent = document.getElementById('readerContent');
    readerContent?.addEventListener('scroll', () => {
        const toolbar = document.getElementById('readerToolbar');
        toolbar.classList.remove('hidden');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (readerContent.scrollTop > 100) toolbar.classList.add('hidden');
        }, 2000);
    });

    // Keyboard shortcut: Escape to close reader
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeReader();
    });

    // Navigate to home
    navigate('home');
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', State.theme);
}

// Boot
document.addEventListener('DOMContentLoaded', init);
