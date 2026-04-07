import type { BoatState } from '../../shared/types';
import { NET_COOLDOWN } from '../../shared/constants';

export class HUD {
  private container: HTMLDivElement;
  private timerEl: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private leaderboardEl: HTMLDivElement;
  private cooldownEl: HTMLDivElement;
  private playerCountEl: HTMLDivElement;
  readonly muteBtn: HTMLButtonElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    const base = {
      position: 'fixed', pointerEvents: 'none',
      fontFamily: "'Segoe UI', Arial, sans-serif", zIndex: '10',
      textShadow: '0 2px 6px rgba(0,0,0,0.7)',
    };
    Object.assign(this.container.style, { ...base, top: '0', left: '0', width: '100%' });

    this.timerEl = this.makeEl({ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: '#fff', padding: '12px' });
    this.container.appendChild(this.timerEl);

    this.scoreEl = this.makeEl({ position: 'fixed', bottom: '20px', left: '20px', fontSize: '22px', color: '#ff9900', fontWeight: 'bold' });
    this.cooldownEl = this.makeEl({ position: 'fixed', bottom: '50px', left: '20px', fontSize: '16px', color: '#aaa' });
    this.playerCountEl = this.makeEl({ position: 'fixed', top: '12px', right: '20px', fontSize: '14px', color: '#ccc' });

    this.leaderboardEl = document.createElement('div');
    Object.assign(this.leaderboardEl.style, {
      position: 'fixed', top: '50px', right: '20px', fontSize: '14px',
      color: '#ddd', textShadow: '0 2px 4px rgba(0,0,0,0.7)',
      pointerEvents: 'none', zIndex: '10', lineHeight: '1.6',
    });

    document.body.appendChild(this.container);
    document.body.appendChild(this.scoreEl);
    document.body.appendChild(this.cooldownEl);
    document.body.appendChild(this.playerCountEl);
    document.body.appendChild(this.leaderboardEl);

    this.muteBtn = document.createElement('button');
    this.muteBtn.textContent = 'Unmute';
    Object.assign(this.muteBtn.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '10',
      padding: '8px 16px', fontSize: '14px', border: '1px solid #666',
      borderRadius: '6px', background: '#222', color: '#ccc', cursor: 'pointer',
    });
    document.body.appendChild(this.muteBtn);
  }

  private makeEl(styles: Record<string, string>): HTMLDivElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
      pointerEvents: 'none', zIndex: '10',
      textShadow: '0 2px 4px rgba(0,0,0,0.7)', ...styles,
    });
    return el;
  }

  updateTimer(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    this.timerEl.style.color = seconds <= 30 ? '#ff4444' : seconds <= 60 ? '#ffaa00' : '#ffffff';
  }

  updateScore(score: number): void {
    this.scoreEl.textContent = `Score: ${score}`;
  }

  updateCooldown(cooldown: number): void {
    if (cooldown > 0) {
      this.cooldownEl.textContent = `Net: ${cooldown.toFixed(1)}s`;
      this.cooldownEl.style.color = '#ff6666';
    } else {
      this.cooldownEl.textContent = 'Net: Ready';
      this.cooldownEl.style.color = '#66ff66';
    }
  }

  updateLeaderboard(boats: BoatState[], localId: string): void {
    const sorted = [...boats].sort((a, b) => b.score - a.score);
    this.leaderboardEl.innerHTML = sorted.map((b, i) => {
      const highlight = b.id === localId ? 'color:#ff9900;font-weight:bold' : '';
      return `<div style="${highlight}">${i + 1}. ${b.name}: ${b.score}</div>`;
    }).join('');
    this.playerCountEl.textContent = `Players: ${boats.length}`;
  }
}
