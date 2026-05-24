# 📚 ManhwaVault

> A beautiful manhwa/comic reading platform with vertical scroll reading, chapter management, and AI-powered recommendations.

**Powered by MiMo V2.5** — the AI brain behind the Curator, Reader, and Library agents.

![MiMo V2.5](https://img.shields.io/badge/Powered%20by-MiMo%20V2.5-FF6B6B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRleHQgeT0iLjllbSIgZm9udC1zaXplPSIyMCI+8J+RpTwvdGV4dD48L3N2Zz4=)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Built for MiMo AI Grant](https://img.shields.io/badge/Built%20for-MiMo%20AI%20Grant-blueviolet?style=for-the-badge)

## 🌐 Live Demo

**[manhwavault.pages.dev](https://crowfly22.github.io/ManhwaVault/)**

## ✨ Features

### 🤖 Curator Agent (Powered by MiMo V2.5)
- AI-powered recommendations based on reading patterns
- Featured/trending section with banner cards
- Genre filter: Action, Romance, Fantasy, Drama, Comedy, Sci-Fi, Horror, Slice of Life
- Instant search with real-time filtering
- Sort by Popular, Latest, Rating, A-Z

### 📖 Reader Agent
- Full vertical scroll reading (Webtoon/Tapas style)
- Canvas-generated illustrations for each page
- Reading progress bar with scroll position tracking
- Auto-hiding toolbar after 3 seconds
- Font size adjustment
- Dark mode toggle in reading view
- Chapter navigation (prev/next)
- Scroll position memory via localStorage

### 📚 Library Agent
- Bookmarks & favorites system
- Reading history tracking
- Continue reading quick access
- Reading stats: chapters read, estimated time, bookmarks count

### 🎨 Design
- Warm coral & teal color palette
- Nunito + Inter typography
- Mobile-first responsive design
- Dark/light mode with system preference detection
- Smooth animations and transitions
- Canvas 2D generated cover art and page illustrations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 ManhwaVault                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Curator Agent │  │ Reader Agent │         │
│  │ (MiMo V2.5)  │  │              │         │
│  │              │  │ • Vertical   │         │
│  │ • Discovery  │  │   Scroll     │         │
│  │ • AI Picks   │  │ • Progress   │         │
│  │ • Genres     │  │ • Navigation │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
│  ┌──────────────┐                            │
│  │ Library Agent │                            │
│  │              │                            │
│  │ • Bookmarks  │  ┌────────────────────┐   │
│  │ • History    │  │ localStorage       │   │
│  │ • Stats      │  │ (All persistent    │   │
│  │ • Collections│  │  data storage)     │   │
│  └──────────────┘  └────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Grid, Flexbox, transitions
- **Vanilla JavaScript** — Zero dependencies
- **Canvas 2D API** — Cover art & page illustration generation
- **localStorage** — Persistent user data (bookmarks, progress, history)
- **Google Fonts** — Nunito (headings) + Inter (body)
- **Intersection Observer** — Lazy loading & progress tracking

## 📁 Project Structure

```
ManhwaVault/
├── index.html      # Main HTML shell
├── styles.css      # All styling with CSS custom properties
├── data.js         # Mock series data & storage helpers
├── canvas.js       # Canvas 2D art generator
├── app.js          # Core application logic
├── LICENSE         # MIT License
└── README.md       # This file
```

## 🚀 Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/crowfly22/ManhwaVault.git
   ```
2. Open `index.html` in a browser — that's it!

No build step. No dependencies. No npm install. Just open and read.

## 📱 Mock Content

8 unique manhwa series with generated cover art:
- **Shadow Monarch** — Action/Fantasy
- **Blossom Heart Academy** — Romance/Drama
- **Dragon Circuit** — Sci-Fi/Action
- **Coffee & Ghosts** — Comedy/Slice of Life
- **Crimson Throne** — Fantasy/Drama
- **Neon Nights** — Sci-Fi/Horror
- **Spirit Kitchen** — Fantasy/Comedy
- **The Last Garden** — Drama/Slice of Life

Each series includes 3-5 chapters with 6 Canvas-generated pages per chapter.

## 📄 License

MIT License — see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- Built for the **MiMo 100T Submission Program**
- Powered by **MiMo V2.5** from Xiaomi
- Inspired by Webtoon, Tapas, and Tachiyomi
