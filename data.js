// ========== MOCK MANHWA DATA ==========
const SERIES_DATA = [
    {
        id: 'shadow-monarch',
        title: 'Shadow Monarch',
        author: 'Park Sungjin',
        genres: ['Action', 'Fantasy'],
        status: 'Ongoing',
        rating: 4.8,
        ratingCount: 12450,
        chapters: 156,
        description: 'When the weakest hunter in the world discovers a hidden power within the shadows, he must rise through the ranks to face an ancient evil that threatens to consume all of humanity. Follow Jinwoo as he transforms from E-rank to the most powerful being alive.',
        colors: ['#1a1a2e', '#16213e', '#e94560'],
        featured: true,
        trending: true,
        chapterList: [
            { num: 1, title: 'The Weakest Hunter', date: '2024-01-15' },
            { num: 2, title: 'Double Dungeon', date: '2024-01-22' },
            { num: 3, title: 'System Awakens', date: '2024-01-29' },
            { num: 4, title: 'First Level Up', date: '2024-02-05' },
            { num: 5, title: 'Shadow Army', date: '2024-02-12' },
        ]
    },
    {
        id: 'blossom-heart',
        title: 'Blossom Heart Academy',
        author: 'Kim Yuna',
        genres: ['Romance', 'Drama'],
        status: 'Ongoing',
        rating: 4.6,
        ratingCount: 8900,
        chapters: 89,
        description: 'When transfer student Hana arrives at the prestigious Blossom Heart Academy, she never expected to fall for the cold and mysterious student council president. But beneath his icy exterior lies a secret that could change everything she believes about love.',
        colors: ['#ff9a9e', '#fecfef', '#fdfcfb'],
        featured: true,
        trending: false,
        chapterList: [
            { num: 1, title: 'New Beginnings', date: '2024-02-01' },
            { num: 2, title: 'The Student Council', date: '2024-02-08' },
            { num: 3, title: 'Rainy Encounter', date: '2024-02-15' },
        ]
    },
    {
        id: 'dragon-circuit',
        title: 'Dragon Circuit',
        author: 'Lee Jaehwan',
        genres: ['Sci-Fi', 'Action'],
        status: 'Completed',
        rating: 4.7,
        ratingCount: 11200,
        chapters: 200,
        description: 'In 2187, dragons aren\'t mythical creatures—they\'re biomechanical weapons. Pilot cadet Ryu must master the Dragon Circuit, an ancient neural link that bonds human and machine, to save Neo-Seoul from an invasion no one saw coming.',
        colors: ['#0f0c29', '#302b63', '#24243e'],
        featured: false,
        trending: true,
        chapterList: [
            { num: 1, title: 'Neo-Seoul 2187', date: '2023-06-01' },
            { num: 2, title: 'The Cadet Exam', date: '2023-06-08' },
            { num: 3, title: 'Dragon\'s Roar', date: '2023-06-15' },
            { num: 4, title: 'Neural Link', date: '2023-06-22' },
        ]
    },
    {
        id: 'coffe-ghost',
        title: 'Coffee & Ghosts',
        author: 'Yoon Seoah',
        genres: ['Comedy', 'Slice of Life'],
        status: 'Ongoing',
        rating: 4.5,
        ratingCount: 6700,
        chapters: 45,
        description: 'Barista Mira discovers her new café is haunted by three friendly but hilariously incompetent ghosts. Between serving lattes and managing spectral roommates, she learns that the afterlife isn\'t so different from the daily grind.',
        colors: ['#d4a574', '#c49b6f', '#8B6914'],
        featured: false,
        trending: false,
        chapterList: [
            { num: 1, title: 'Grand Opening', date: '2024-03-01' },
            { num: 2, title: 'The First Customer', date: '2024-03-08' },
            { num: 3, title: 'Latte Art Disaster', date: '2024-03-15' },
        ]
    },
    {
        id: 'crimson-throne',
        title: 'Crimson Throne',
        author: 'Choi Minho',
        genres: ['Fantasy', 'Drama'],
        status: 'Ongoing',
        rating: 4.9,
        ratingCount: 15600,
        chapters: 234,
        description: 'In a world where power is inherited through blood, an orphan girl discovers she carries the bloodline of the fallen Crimson King. Now she must navigate court politics, deadly alliances, and forbidden magic to claim what is rightfully hers.',
        colors: ['#8B0000', '#4a0000', '#2d0000'],
        featured: true,
        trending: true,
        chapterList: [
            { num: 1, title: 'The Orphan', date: '2023-09-01' },
            { num: 2, title: 'Blood Awakens', date: '2023-09-08' },
            { num: 3, title: 'The Court', date: '2023-09-15' },
            { num: 4, title: 'Crimson Dance', date: '2023-09-22' },
            { num: 5, title: 'Throne of Lies', date: '2023-09-29' },
        ]
    },
    {
        id: 'neon-nights',
        title: 'Neon Nights',
        author: 'Jeon Hyejin',
        genres: ['Sci-Fi', 'Horror'],
        status: 'Completed',
        rating: 4.4,
        ratingCount: 5300,
        chapters: 78,
        description: 'When a rogue AI begins corrupting the neon-lit streets of Cyber-Seoul, detective Kang must team up with an android partner who claims to feel emotions. Together they uncover a conspiracy that blurs the line between human and machine.',
        colors: ['#0a0a2a', '#1a0a3a', '#00ff88'],
        featured: false,
        trending: false,
        chapterList: [
            { num: 1, title: 'Neon Rain', date: '2023-11-01' },
            { num: 2, title: 'The Android', date: '2023-11-08' },
            { num: 3, title: 'Ghost in the Grid', date: '2023-11-15' },
        ]
    },
    {
        id: 'spirit-kitchen',
        title: 'Spirit Kitchen',
        author: 'Baek Soojin',
        genres: ['Fantasy', 'Comedy'],
        status: 'Ongoing',
        rating: 4.3,
        ratingCount: 4200,
        chapters: 34,
        description: 'When chef Tae discovers his grandmother\'s secret cookbook contains recipes that summon spirits, his quiet restaurant becomes the hottest supernatural dining spot in town. Each spirit has a story—and a very specific appetite.',
        colors: ['#ff6b35', '#f7c59f', '#2d4059'],
        featured: false,
        trending: false,
        chapterList: [
            { num: 1, title: 'Grandma\'s Recipe', date: '2024-04-01' },
            { num: 2, title: 'The First Spirit', date: '2024-04-08' },
            { num: 3, title: 'Phantom Appetite', date: '2024-04-15' },
        ]
    },
    {
        id: 'last-garden',
        title: 'The Last Garden',
        author: 'Han Jiwoo',
        genres: ['Drama', 'Slice of Life'],
        status: 'Completed',
        rating: 4.6,
        ratingCount: 7800,
        chapters: 56,
        description: 'After the world ends, a botanist tends the last remaining garden on Earth. Through changing seasons and unexpected visitors, she discovers that even in desolation, life finds a way—and so does hope.',
        colors: ['#2d5016', '#4a7c2f', '#8bc34a'],
        featured: false,
        trending: false,
        chapterList: [
            { num: 1, title: 'The Last Seed', date: '2023-12-01' },
            { num: 2, title: 'First Frost', date: '2023-12-08' },
            { num: 3, title: 'Unexpected Guest', date: '2023-12-15' },
        ]
    }
];

const ALL_GENRES = ['All', 'Action', 'Romance', 'Fantasy', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Slice of Life'];
const SORT_OPTIONS = ['Popular', 'Latest', 'Rating', 'A-Z'];

// Storage helpers
const Storage = {
    get(key, fallback) {
        try { return JSON.parse(localStorage.getItem('mv_' + key)) || fallback; }
        catch { return fallback; }
    },
    set(key, val) { localStorage.setItem('mv_' + key, JSON.stringify(val)); }
};

// Initialize defaults
if (!Storage.get('bookmarks', null)) Storage.set('bookmarks', []);
if (!Storage.get('history', null)) Storage.set('history', []);
if (!Storage.get('progress', null)) Storage.set('progress', {});
if (!Storage.get('chaptersRead', null)) Storage.set('chaptersRead', []);
if (!Storage.get('theme', null)) Storage.set('theme', 'auto');
