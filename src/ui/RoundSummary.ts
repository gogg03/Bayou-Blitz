import { RESULTS_DISPLAY_TIME } from '../../shared/constants';

interface ScoreEntry { id: string; name: string; score: number; }

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const RANK_COLORS = ['#d4920a', '#a8b0b8', '#a0724a'];
const RANK_LABELS = ['\u{1F451}', '\u{1F948}', '\u{1F949}'];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, styles: Partial<CSSStyleDeclaration>, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  parent?.appendChild(e);
  return e;
}

export class RoundSummary {
  private overlay: HTMLDivElement;
  private rankingsEl: HTMLDivElement;
  private globalBody: HTMLDivElement;
  private countdownEl: HTMLDivElement;
  private countdownTimer = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.overlay = el('div', {
      position: 'fixed', inset: '0', display: 'none',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(13,34,17,0.92) 0%, rgba(10,26,13,0.96) 100%)',
      zIndex: '50', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#e0d8c8',
    });

    const container = el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
    }, this.overlay);

    const title = el('h2', {
      color: '#d4920a', fontSize: '42px', margin: '0 0 6px',
      textTransform: 'uppercase', letterSpacing: '6px', fontWeight: '900',
      textShadow: '0 0 20px rgba(212,146,10,0.6), 0 0 40px rgba(212,146,10,0.3)',
    }, container);
    title.textContent = 'ROUND OVER';

    const divider = el('div', {
      width: '80%', height: '2px', margin: '0 0 18px',
      background: 'linear-gradient(90deg, transparent, #c47f08, transparent)',
    }, container);

    const rankPanel = el('div', {
      width: '100%', padding: '14px 18px', marginBottom: '16px',
      background: 'rgba(10,26,13,0.7)', border: '1px solid rgba(196,127,8,0.25)',
      borderRadius: '8px', boxSizing: 'border-box',
    }, container);

    this.rankingsEl = el('div', { lineHeight: '1.9' }, rankPanel);

    const globalPanel = el('div', {
      width: '100%', padding: '14px 18px', marginBottom: '18px',
      background: 'rgba(10,26,13,0.7)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px', boxSizing: 'border-box',
    }, container);

    const globalTitle = el('div', {
      color: '#a09880', fontSize: '13px', fontWeight: '700',
      letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px',
    }, globalPanel);
    globalTitle.textContent = 'ALL-TIME BEST';

    this.globalBody = el('div', { fontSize: '14px', lineHeight: '1.7', color: '#b0a890' }, globalPanel);

    this.countdownEl = el('div', {
      fontSize: '16px', color: '#a09880', letterSpacing: '1px', transition: 'color 0.3s',
    }, container);

    document.body.appendChild(this.overlay);
  }

  show(scores: ScoreEntry[], localId: string): void {
    this.rankingsEl.innerHTML = '';
    scores.forEach((s, i) => {
      const row = el('div', {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '2px 6px', borderRadius: '4px',
        background: s.id === localId ? 'rgba(212,146,10,0.12)' : 'transparent',
      }, this.rankingsEl);

      const left = el('span', { fontWeight: i < 3 ? '700' : '400' }, row);
      const rankColor = s.id === localId ? '#d4920a' : (RANK_COLORS[i] || '#e0d8c8');
      const label = RANK_LABELS[i] || `${i + 1}.`;
      left.innerHTML = `<span style="margin-right:8px;font-size:${i === 0 ? '20px' : '16px'}">${label}</span>` +
        `<span style="color:${rankColor}">${s.name}</span>`;

      const right = el('span', {
        color: rankColor, fontWeight: '700',
        fontSize: i === 0 ? '20px' : '16px',
      }, row);
      right.textContent = `${s.score}`;

      if (i === 0) {
        Object.assign(row.style, {
          fontSize: '18px', padding: '4px 8px',
          boxShadow: '0 0 12px rgba(212,146,10,0.15)',
        });
      }
    });

    this.overlay.style.display = 'flex';
    this.countdownTimer = RESULTS_DISPLAY_TIME;
    this.updateCountdown();

    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.countdownTimer -= 1;
      this.updateCountdown();
      if (this.countdownTimer <= 0 && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 1000);

    this.submitScores(scores);
    this.fetchGlobalLeaderboard();
  }

  hide(): void {
    this.overlay.style.display = 'none';
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  private updateCountdown(): void {
    const t = Math.max(0, Math.ceil(this.countdownTimer));
    this.countdownEl.textContent = `Next round in ${t}s`;
    const urgency = 1 - t / RESULTS_DISPLAY_TIME;
    const r = Math.round(160 + urgency * 52);
    const g = Math.round(152 - urgency * 80);
    const b = Math.round(128 - urgency * 100);
    this.countdownEl.style.color = `rgb(${r},${g},${b})`;
    this.countdownEl.style.textShadow = urgency > 0.7 ? '0 0 8px rgba(212,146,10,0.5)' : 'none';
  }

  private async fetchGlobalLeaderboard(): Promise<void> {
    this.globalBody.textContent = 'Loading\u2026';
    try {
      const res = await fetch(`${API_BASE}/scores`);
      const data = await res.json() as { name: string; score: number }[];
      if (!data.length) { this.globalBody.textContent = 'No scores yet'; return; }
      this.globalBody.innerHTML = data.map((s, i) => {
        const c = i === 0 ? '#d4920a' : i < 3 ? '#c0b090' : '#908878';
        return `<div style="display:flex;justify-content:space-between;padding:1px 4px">` +
          `<span style="color:${c}">${i + 1}. ${s.name}</span>` +
          `<span style="color:${c};font-weight:600">${s.score}</span></div>`;
      }).join('');
    } catch {
      this.globalBody.textContent = 'Could not load leaderboard';
    }
  }

  private async submitScores(scores: ScoreEntry[]): Promise<void> {
    for (const s of scores) {
      if (s.score <= 0) continue;
      try {
        await fetch(`${API_BASE}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: s.name, score: s.score }),
        });
      } catch { /* ignore */ }
    }
  }
}
