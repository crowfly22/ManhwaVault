// ========== CANVAS ART GENERATOR ==========
const ArtGen = {
    // Generate cover art for a series
    cover(canvas, series) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = 450;
        const h = canvas.height = 600;
        const colors = series.colors;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.5, colors[1]);
        grad.addColorStop(1, colors[2] || colors[0]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Abstract patterns based on series id hash
        const hash = series.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        ctx.globalAlpha = 0.15;

        // Geometric shapes
        for (let i = 0; i < 8; i++) {
            const x = (hash * (i + 1) * 37) % w;
            const y = (hash * (i + 1) * 53) % h;
            const r = 30 + (hash * (i + 1)) % 80;
            ctx.beginPath();
            if (i % 3 === 0) {
                ctx.arc(x, y, r, 0, Math.PI * 2);
            } else if (i % 3 === 1) {
                ctx.rect(x - r / 2, y - r / 2, r, r);
            } else {
                ctx.moveTo(x, y - r);
                ctx.lineTo(x + r, y + r);
                ctx.lineTo(x - r, y + r);
                ctx.closePath();
            }
            ctx.fillStyle = `rgba(255,255,255,${0.05 + (i % 3) * 0.05})`;
            ctx.fill();
        }

        // Diagonal lines
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const offset = i * 80 - 100;
            ctx.beginPath();
            ctx.moveTo(offset, 0);
            ctx.lineTo(offset + h, h);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Title text
        const titleLines = this.wrapText(series.title, w - 40, 'bold 36px Nunito, sans-serif');
        ctx.font = 'bold 36px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        const startY = h * 0.45;
        titleLines.forEach((line, i) => {
            ctx.fillText(line, w / 2 + 2, startY + i * 42 + 2);
        });
        ctx.fillStyle = '#fff';
        titleLines.forEach((line, i) => {
            ctx.fillText(line, w / 2, startY + i * 42);
        });

        // Author
        ctx.font = '500 16px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('by ' + series.author, w / 2, startY + titleLines.length * 42 + 20);

        // Genre tags at bottom
        ctx.font = '600 12px Inter, sans-serif';
        const tagY = h - 30;
        series.genres.forEach((g, i) => {
            const tw = ctx.measureText(g).width + 16;
            const tx = w / 2 - (series.genres.length * (tw + 4)) / 2 + i * (tw + 4);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.roundRect(tx, tagY - 12, tw, 22, 11);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.textAlign = 'center';
            ctx.fillText(g, tx + tw / 2, tagY + 3);
        });

        return canvas;
    },

    // Generate a reading page illustration
    page(canvas, seriesId, pageNum, totalPages) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = 800;
        const h = canvas.height = 1200;

        const series = SERIES_DATA.find(s => s.id === seriesId);
        const colors = series ? series.colors : ['#1a1a2e', '#16213e', '#e94560'];

        // Unique pattern per page
        const seed = (seriesId + pageNum).split('').reduce((a, c) => a + c.charCodeAt(0), 0);

        // Background
        const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
        const angle = (seed % 4) * 0.25;
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.5 + angle, colors[1]);
        grad.addColorStop(1, colors[2] || colors[0]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Scene elements
        ctx.globalAlpha = 0.2;

        // Large background shapes
        for (let i = 0; i < 12; i++) {
            const x = (seed * (i + 1) * 31) % w;
            const y = (seed * (i + 1) * 47) % h;
            const size = 50 + (seed * (i + 1)) % 150;
            ctx.fillStyle = `hsla(${(seed * (i + 1) * 7) % 360}, 60%, 60%, 0.15)`;
            ctx.beginPath();
            if (i % 4 === 0) {
                ctx.arc(x, y, size, 0, Math.PI * 2);
            } else if (i % 4 === 1) {
                ctx.ellipse(x, y, size, size * 0.6, (seed * i) % Math.PI, 0, Math.PI * 2);
            } else if (i % 4 === 2) {
                for (let j = 0; j < 6; j++) {
                    const a = (j / 6) * Math.PI * 2;
                    const px = x + Math.cos(a) * size;
                    const py = y + Math.sin(a) * size;
                    j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath();
            } else {
                ctx.rect(x - size / 2, y - size / 2, size, size * 1.5);
            }
            ctx.fill();
        }

        // Horizontal panels (manga style)
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        const panelCount = 2 + (seed % 3);
        for (let i = 0; i < panelCount; i++) {
            const y = (h / (panelCount + 1)) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Particle dots
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 40; i++) {
            const x = (seed * (i + 100) * 13) % w;
            const y = (seed * (i + 100) * 17) % h;
            const r = 1 + (seed * i) % 4;
            ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.1})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Page number
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(`— Page ${pageNum} of ${totalPages} —`, w / 2, h - 30);

        return canvas;
    },

    // Small thumbnail cover
    thumb(canvas, series) {
        canvas.width = 150;
        canvas.height = 200;
        return this.cover(canvas, series);
    },

    wrapText(text, maxWidth, font) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = font;
        const words = text.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? current + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }
};
