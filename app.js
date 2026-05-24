// ========== MANHWA VAULT APP ==========
const app = {
    currentPage: 'home',
    currentGenre: 'All',
    currentSort: 'Popular',
    searchQuery: '',
    readerTimeout: null,

    init() {
        this.initTheme();
        this.bindEvents();
        this.navigate('home');
    },

    // ========== THEME ==========
    initTheme() {
        const saved = Storage.get('theme', 'auto');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved === 'auto' ? (prefersDark ? 'dark' : 'light') : saved;
        document.documentElement.setAttribute('data-theme', theme);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        Storage.set('theme', next);
    },

    // ========== EVENTS ==========
    bindEvents() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('reader-theme').addEventListener('click', () => this.toggleTheme());

        // Search
        document.getElementById('search-toggle').addEventListener('click', () => {
            const bar = document.getElementById('search-bar');
            bar.classList.toggle('hidden');
            if (!bar.classList.contains('hidden')) {
                document.getElementById('search-input').focus();
            }
        });
        document.getElementById('search-close').addEventListener('click', () => {
            document.getElementById('search-bar').classList.add('hidden');
            this.searchQuery = '';
            document.getElementById('search-input').value = '';
            this.renderCurrentPage();
        });
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            if (this.currentPage === 'browse' || this.currentPage === 'home') {
                this.renderBrowse();
            }
        });

        // Bottom nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigate(btn.dataset.page);
            });
        });

        // Reader
        document.getElementById('reader-back').addEventListener('click', () => this.closeReader());
        document.getElementById('prev-chapter').addEventListener('click', () => this.navChapter(-1));
        document.getElementById('next-chapter').addEventListener('click', () => this.navChapter(1));
        document.getElementById('reader-font-up').addEventListener('click', () => this.adjustFont(1));
        document.getElementById('reader-font-down').addEventListener('click', () => this.adjustFont(-1));

        // Reader toolbar auto-hide
        document.getElementById('reader-content').addEventListener('click', () => {
            this.toggleReaderToolbar();
        });

        // Reader scroll progress
        window.addEventListener('scroll', () => {
            if (!document.getElementById('reader-overlay').classList.contains('hidden')) {
                this.updateReaderProgress();
            }
        });
    },

    // ========== NAVIGATION ==========
    navigate(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.page === page);
        });
        this.renderCurrentPage();
    },

    renderCurrentPage() {
        const main = document.getElementById('app');
        switch (this.currentPage) {
            case 'home': this.renderHome(main); break;
            case 'browse': this.renderBrowse(main); break;
            case 'library': this.renderLibrary(main); break;
            case 'detail': this.renderDetail(main); break;
        }
    },

    // ========== HOME PAGE ==========
    renderHome(container) {
        const featured = SERIES_DATA.filter(s => s.featured || s.trending);
        const hero = featured[0];
        const aiPicks = SERIES_DATA.slice().sort(() => 0.5 - Math.random()).slice(0, 4);

        container.innerHTML = `
            <div class="fade-in">
                <!-- Hero -->
                <div class="section" style="padding-bottom:0">
                    <div class="hero-banner" onclick="app.openDetail('${hero.id}')">
                        <canvas id="hero-canvas"></canvas>
                        <div class="hero-overlay">
                            <div class="hero-badge">🔥 Trending</div>
                            <h2>${hero.title}</h2>
                            <p>${hero.description.substring(0, 80)}...</p>
                        </div>
                    </div>
                </div>

                <!-- AI Picks -->
                <div class="section">
                    <div class="section-header">
                        <div>
                            <div class="section-title">🤖 AI Picks</div>
                            <div class="section-subtitle">Recommended by MiMo V2.5 Curator Agent</div>
                        </div>
                    </div>
                    <div class="series-grid">
                        ${aiPicks.map(s => this.seriesCardHTML(s)).join('')}
                    </div>
                </div>

                <!-- Continue Reading -->
                ${this.continueReadingHTML()}

                <!-- Trending -->
                <div class="section">
                    <div class="section-header">
                        <div>
                            <div class="section-title">🔥 Trending Now</div>
                            <div class="section-subtitle">Most popular this week</div>
                        </div>
                    </div>
                    <div class="series-grid">
                        ${SERIES_DATA.filter(s => s.trending).map(s => this.seriesCardHTML(s)).join('')}
                    </div>
                </div>

                <!-- All Series -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">📚 All Series</div>
                    </div>
                    <div class="series-grid">
                        ${SERIES_DATA.map(s => this.seriesCardHTML(s)).join('')}
                    </div>
                </div>
            </div>
        `;

        // Generate hero canvas
        const heroCanvas = document.getElementById('hero-canvas');
        if (heroCanvas) ArtGen.cover(heroCanvas, hero);

        this.generateAllThumbs();
    },

    // ========== BROWSE PAGE ==========
    renderBrowse(container) {
        let filtered = SERIES_DATA;

        // Search filter
        if (this.searchQuery) {
            filtered = filtered.filter(s =>
                s.title.toLowerCase().includes(this.searchQuery) ||
                s.author.toLowerCase().includes(this.searchQuery) ||
                s.genres.some(g => g.toLowerCase().includes(this.searchQuery))
            );
        }

        // Genre filter
        if (this.currentGenre !== 'All') {
            filtered = filtered.filter(s => s.genres.includes(this.currentGenre));
        }

        // Sort
        switch (this.currentSort) {
            case 'Popular': filtered.sort((a, b) => b.ratingCount - a.ratingCount); break;
            case 'Latest': filtered.sort((a, b) => b.chapters - a.chapters); break;
            case 'Rating': filtered.sort((a, b) => b.rating - a.rating); break;
            case 'A-Z': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
        }

        if (!container) container = document.getElementById('app');
        container.innerHTML = `
            <div class="fade-in">
                <!-- Genre Tabs -->
                <div class="genre-tabs" style="margin-top:12px">
                    ${ALL_GENRES.map(g => `
                        <button class="genre-tab ${this.currentGenre === g ? 'active' : ''}"
                                onclick="app.setGenre('${g}')">${g}</button>
                    `).join('')}
                </div>

                <!-- Sort -->
                <div class="sort-bar">
                    ${SORT_OPTIONS.map(s => `
                        <button class="sort-btn ${this.currentSort === s ? 'active' : ''}"
                                onclick="app.setSort('${s}')">${s}</button>
                    `).join('')}
                </div>

                <!-- Results -->
                <div class="section">
                    ${filtered.length === 0 ? `
                        <div class="empty-state">
                            <div class="emoji">🔍</div>
                            <p>No series found. Try a different search or genre.</p>
                        </div>
                    ` : `
                        <div class="series-grid">
                            ${filtered.map(s => this.seriesCardHTML(s)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        this.generateAllThumbs();
    },

    // ========== SERIES DETAIL ==========
    openDetail(id) {
        this.currentDetailId = id;
        this.navigate('detail');
    },

    renderDetail(container) {
        const s = SERIES_DATA.find(x => x.id === this.currentDetailId);
        if (!s) { this.navigate('home'); return; }

        const bookmarks = Storage.get('bookmarks', []);
        const isFav = bookmarks.includes(s.id);
        const progress = Storage.get('progress', {});
        const lastChapter = progress[s.id] || 0;
        const chaptersRead = Storage.get('chaptersRead', []);

        container.innerHTML = `
            <div class="detail-page fade-in">
                <div class="detail-banner">
                    <canvas id="detail-cover"></canvas>
                    <div class="detail-banner-overlay">
                        <div class="detail-title">${s.title}</div>
                        <div class="detail-author">by ${s.author}</div>
                    </div>
                </div>

                <div class="detail-actions">
                    <button class="btn-primary" onclick="app.startReading('${s.id}', ${lastChapter > 0 ? lastChapter : 1})">
                        ${lastChapter > 0 ? `▶ Continue Ch. ${lastChapter}` : '▶ Start Reading'}
                    </button>
                    <button class="btn-secondary btn-fav ${isFav ? 'active' : ''}" onclick="app.toggleBookmark('${s.id}', this)">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>

                <div class="detail-meta">
                    ${s.genres.map(g => `<span class="meta-badge">${g}</span>`).join('')}
                    <span class="meta-badge ${s.status === 'Ongoing' ? 'status-ongoing' : 'status-completed'}">${s.status}</span>
                    <span class="meta-badge">${s.chapters} chapters</span>
                </div>

                <div class="detail-rating">
                    <span class="stars">${'★'.repeat(Math.floor(s.rating))}${'☆'.repeat(5 - Math.floor(s.rating))}</span>
                    <span class="rating-value">${s.rating}</span>
                    <span class="rating-count">(${s.ratingCount.toLocaleString()} ratings)</span>
                </div>

                <div class="detail-synopsis">${s.description}</div>

                <div class="chapter-list-header">Chapters</div>
                <div class="chapter-list">
                    ${s.chapterList.map(ch => `
                        <div class="chapter-item ${chaptersRead.includes(s.id + '_' + ch.num) ? 'read' : ''}"
                             onclick="app.startReading('${s.id}', ${ch.num})">
                            <div class="chapter-num">${ch.num}</div>
                            <div class="chapter-info">
                                <div class="chapter-name">${ch.title}</div>
                                <div class="chapter-date">${ch.date}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const canvas = document.getElementById('detail-cover');
        if (canvas) ArtGen.cover(canvas, s);
    },

    // ========== LIBRARY PAGE ==========
    renderLibrary(container) {
        const bookmarks = Storage.get('bookmarks', []);
        const history = Storage.get('history', []);
        const progress = Storage.get('progress', {});
        const chaptersRead = Storage.get('chaptersRead', []);

        const bookmarkedSeries = SERIES_DATA.filter(s => bookmarks.includes(s.id));
        const continueSeries = history.slice(0, 5).map(id => SERIES_DATA.find(s => s.id === id)).filter(Boolean);

        if (!container) container = document.getElementById('app');
        container.innerHTML = `
            <div class="fade-in">
                <!-- Stats -->
                <div class="section">
                    <div class="section-header">
                        <div>
                            <div class="section-title">📊 Reading Stats</div>
                            <div class="section-subtitle">Tracked by Library Agent</div>
                        </div>
                    </div>
                    <div class="library-stats">
                        <div class="stat-card">
                            <div class="stat-value">${chaptersRead.length}</div>
                            <div class="stat-label">Chapters Read</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${bookmarks.length}</div>
                            <div class="stat-label">Bookmarks</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Math.round(chaptersRead.length * 4.5)}</div>
                            <div class="stat-label">Minutes Reading</div>
                        </div>
                    </div>
                </div>

                <!-- Continue Reading -->
                ${continueSeries.length > 0 ? `
                    <div class="section">
                        <div class="section-header">
                            <div class="section-title">📖 Continue Reading</div>
                        </div>
                        ${continueSeries.map(s => `
                            <div class="continue-card" onclick="app.openDetail('${s.id}')">
                                <div class="continue-cover"><canvas data-thumb="${s.id}"></canvas></div>
                                <div class="continue-info">
                                    <div class="continue-title">${s.title}</div>
                                    <div class="continue-chapter">Continue Ch. ${progress[s.id] || 1}</div>
                                    <div class="continue-progress-bar">
                                        <div class="continue-progress-fill" style="width:${((progress[s.id] || 1) / s.chapterList.length * 100)}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Bookmarks -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">❤️ Favorites</div>
                    </div>
                    ${bookmarkedSeries.length === 0 ? `
                        <div class="empty-state">
                            <div class="emoji">📚</div>
                            <p>No favorites yet. Tap the heart on any series to save it!</p>
                        </div>
                    ` : `
                        <div class="series-grid">
                            ${bookmarkedSeries.map(s => this.seriesCardHTML(s)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        this.generateAllThumbs();
        // Generate continue reading thumbs
        container.querySelectorAll('canvas[data-thumb]').forEach(c => {
            const series = SERIES_DATA.find(s => s.id === c.dataset.thumb);
            if (series) ArtGen.thumb(c, series);
        });
    },

    // ========== READER ==========
    currentReaderSeries: null,
    currentReaderChapter: null,

    startReading(seriesId, chapterNum) {
        const series = SERIES_DATA.find(s => s.id === seriesId);
        if (!series) return;

        const chapter = series.chapterList.find(c => c.num === chapterNum);
        if (!chapter) return;

        this.currentReaderSeries = series;
        this.currentReaderChapter = chapter;

        // Update history
        let history = Storage.get('history', []);
        history = history.filter(id => id !== seriesId);
        history.unshift(seriesId);
        Storage.set('history', history.slice(0, 20));

        // Update progress
        let progress = Storage.get('progress', {});
        progress[seriesId] = chapterNum;
        Storage.set('progress', progress);

        // Mark chapter read
        let chaptersRead = Storage.get('chaptersRead', []);
        const key = seriesId + '_' + chapterNum;
        if (!chaptersRead.includes(key)) {
            chaptersRead.push(key);
            Storage.set('chaptersRead', chaptersRead);
        }

        this.openReader(series, chapter);
    },

    openReader(series, chapter) {
        const overlay = document.getElementById('reader-overlay');
        overlay.classList.remove('hidden');
        document.getElementById('reader-title').textContent = `${series.title} — Ch. ${chapter.num}: ${chapter.title}`;
        document.body.style.overflow = 'hidden';

        const content = document.getElementById('reader-content');
        const totalPages = 6;

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<div class="reader-page"><canvas id="page-${i}"></canvas></div>`;
            if (i === 3) {
                html += `<div class="reader-page-text">
                    <p style="font-size:1.1em;font-weight:600;margin-bottom:8px">Chapter ${chapter.num}: ${chapter.title}</p>
                    <p>The story continues as our hero faces new challenges. Tension rises in this pivotal chapter that will change everything...</p>
                </div>`;
            }
        }
        content.innerHTML = html;

        // Generate page art
        for (let i = 1; i <= totalPages; i++) {
            const c = document.getElementById('page-' + i);
            if (c) ArtGen.page(c, series.id, i, totalPages);
        }

        // Reset scroll
        window.scrollTo(0, 0);
        this.updateReaderProgress();

        // Setup toolbar auto-hide
        this.resetReaderToolbarTimer();
        document.getElementById('reader-toolbar').classList.remove('hide');

        // Update nav buttons
        const chIdx = series.chapterList.indexOf(chapter);
        document.getElementById('prev-chapter').disabled = chIdx <= 0;
        document.getElementById('next-chapter').disabled = chIdx >= series.chapterList.length - 1;
    },

    closeReader() {
        document.getElementById('reader-overlay').classList.add('hidden');
        document.body.style.overflow = '';
    },

    navChapter(dir) {
        if (!this.currentReaderSeries || !this.currentReaderChapter) return;
        const chIdx = this.currentReaderSeries.chapterList.indexOf(this.currentReaderChapter);
        const newIdx = chIdx + dir;
        if (newIdx < 0 || newIdx >= this.currentReaderSeries.chapterList.length) return;
        this.startReading(this.currentReaderSeries.id, this.currentReaderSeries.chapterList[newIdx].num);
    },

    updateReaderProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
        document.getElementById('reader-progress-fill').style.width = pct + '%';
    },

    toggleReaderToolbar() {
        const toolbar = document.getElementById('reader-toolbar');
        toolbar.classList.toggle('hide');
        this.resetReaderToolbarTimer();
    },

    resetReaderToolbarTimer() {
        clearTimeout(this.readerTimeout);
        this.readerTimeout = setTimeout(() => {
            document.getElementById('reader-toolbar').classList.add('hide');
        }, 3000);
    },

    adjustFont(dir) {
        const content = document.getElementById('reader-content');
        const current = parseFloat(getComputedStyle(content).fontSize);
        content.style.fontSize = (current + dir * 2) + 'px';
    },

    // ========== BOOKMARKS ==========
    toggleBookmark(id, btn) {
        let bookmarks = Storage.get('bookmarks', []);
        if (bookmarks.includes(id)) {
            bookmarks = bookmarks.filter(b => b !== id);
            btn.classList.remove('active');
            btn.innerHTML = '🤍';
        } else {
            bookmarks.push(id);
            btn.classList.add('active');
            btn.innerHTML = '❤️';
        }
        Storage.set('bookmarks', bookmarks);
    },

    // ========== HELPERS ==========
    seriesCardHTML(s) {
        return `
            <div class="series-card" onclick="app.openDetail('${s.id}')">
                <div class="series-card-cover">
                    <canvas data-thumb="${s.id}"></canvas>
                    <span class="series-card-status">${s.status}</span>
                    <span class="series-card-rating">★ ${s.rating}</span>
                </div>
                <div class="series-card-info">
                    <div class="series-card-title">${s.title}</div>
                    <div class="series-card-meta">
                        ${s.genres.slice(0, 2).map(g => `<span class="series-card-tag">${g}</span>`).join('')}
                    </div>
                    <div class="series-card-chapters">${s.chapters} chapters</div>
                </div>
            </div>
        `;
    },

    continueReadingHTML() {
        const history = Storage.get('history', []);
        const progress = Storage.get('progress', {});
        const continueSeries = history.slice(0, 3).map(id => SERIES_DATA.find(s => s.id === id)).filter(Boolean);

        if (continueSeries.length === 0) return '';

        return `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">📖 Continue Reading</div>
                </div>
                ${continueSeries.map(s => `
                    <div class="continue-card" onclick="app.openDetail('${s.id}')">
                        <div class="continue-cover"><canvas data-thumb="${s.id}"></canvas></div>
                        <div class="continue-info">
                            <div class="continue-title">${s.title}</div>
                            <div class="continue-chapter">Continue Ch. ${progress[s.id] || 1}</div>
                            <div class="continue-progress-bar">
                                <div class="continue-progress-fill" style="width:${((progress[s.id] || 1) / s.chapterList.length * 100)}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateAllThumbs() {
        document.querySelectorAll('canvas[data-thumb]').forEach(c => {
            const series = SERIES_DATA.find(s => s.id === c.dataset.thumb);
            if (series) ArtGen.thumb(c, series);
        });
    },

    setGenre(genre) {
        this.currentGenre = genre;
        this.renderBrowse();
    },

    setSort(sort) {
        this.currentSort = sort;
        this.renderBrowse();
    }
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => app.init());
