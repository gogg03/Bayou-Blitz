import { RESULTS_DISPLAY_TIME } from '../../shared/constants';

interface ScoreEntry {
  id: string;
  name: string;
  score: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export class RoundSummary {
  private overlay: HTMLDivElement;
  private rankingsEl: HTMLDivElement;
  private globalEl: HTMLDivElement;
  private countdownEl: HTMLDivElement;
  private countdownTimer: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', inset: '0', display: 'none',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,26,13,0.88)', zIndex: '50',
      fontFamily: "'Segoe UI', Arial, sans-serif", color: '#fff',
    });

    const title = document.createElement('h2');
    title.textContent = 'Round Over';
    Object.assign(title.style, { color: '#ff9900', fontSize: '36px', marginBottom: '16px' });
    this.overlay.appendChild(title);

    this.rankingsEl = document.createElement('div');
    Object.assign(this.rankingsEl.style, { marginBottom: '24px', fontSize: '18px', lineHeight: '1.8' });
    this.overlay.appendChild(this.rankingsEl);

    const globalTitle = document.createElement('h3');
    globalTitle.textContent = 'Global Leaderboard';
    Object.assign(globalTitle.style, { color: '#aaa', fontSize: '16px', marginBottom: '8px' });
    this.overlay.appendChild(globalTitle);

    this.globalEl = document.createElement('div');
    Object.assign(this.globalEl.style, { marginBottom: '24px', fontSize: '14px', lineHeight: '1.6', color: '#ccc' });
    this.overlay.appendChild(this.globalEl);

    this.countdownEl = document.createElement('div');
    Object.assign(this.countdownEl.style, { fontSize: '16px', color: '#aaa' });
    this.overlay.appendChild(this.countdownEl);

    document.body.appendChild(this.overlay);
  }

  show(scores: ScoreEntry[], localId: string): void {
    this.rankingsEl.innerHTML = scores.map((s, i) => {
      const hl = s.id === localId ? 'color:#ff9900;font-weight:bold' : '';
      const medal = i === 0 ? ' &#x1F947;' : i === 1 ? ' &#x1F948;' : i === 2 ? ' &#x1F949;' : '';
      return `<div style="${hl}">${i + 1}. ${s.name}: ${s.score}${medal}</div>`;
    }).join('');

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

    this.fetchGlobalLeaderboard();
    this.submitScores(scores);
  }

  hide(): void {
    this.overlay.style.display = 'none';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateCountdown(): void {
    const t = Math.max(0, Math.ceil(this.countdownTimer));
    this.countdownEl.textContent = `Next round in ${t}s`;
  }

  private async fetchGlobalLeaderboard(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/scores`);
      const data = await res.json() as { name: string; score: number }[];
      this.globalEl.innerHTML = data.map((s, i) =>
        `<div>${i + 1}. ${s.name}: ${s.score}</div>`
      ).join('');
    } catch {
      this.globalEl.textContent = 'Could not load leaderboard';
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
