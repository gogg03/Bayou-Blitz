import type { BoatState } from '../../shared/types';
import { NET_COOLDOWN } from '../../shared/constants';

const S = (el: HTMLElement, s: Partial<CSSStyleDeclaration>) => Object.assign(el.style, s);
const DIV = (parent: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
  const d = document.createElement('div');
  S(d, styles);
  parent.appendChild(d);
  return d;
};

const BG = 'rgba(10,26,13,0.82)';
const BORDER = '1px solid rgba(100,120,80,0.35)';
const AMBER = '#d4920a';
const TEXT = '#e0d8c8';
const FONT = "'Courier New', 'Consolas', monospace";
const SHADOW = '0 2px 8px rgba(0,0,0,0.6)';

export class HUD {
  readonly muteBtn: HTMLButtonElement;
  private timerEl: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private cooldownBar: HTMLDivElement;
  private cooldownFill: HTMLDivElement;
  private cooldownLabel: HTMLDivElement;
  private lbBody: HTMLDivElement;
  private lbCount: HTMLSpanElement;

  constructor() {
    const timerPanel = DIV(document.body, {
      position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)',
      zIndex: '10', pointerEvents: 'none', background: BG, border: BORDER,
      borderRadius: '8px', padding: '6px 28px', boxShadow: SHADOW,
    });
    this.timerEl = DIV(timerPanel, {
      fontFamily: FONT, fontSize: '32px', fontWeight: 'bold',
      color: '#fff', textAlign: 'center', letterSpacing: '2px',
      textShadow: '0 0 12px rgba(212,146,10,0.4)',
    });
    this.timerEl.textContent = '3:00';

    const bottomLeft = DIV(document.body, {
      position: 'fixed', bottom: '18px', left: '18px', zIndex: '10',
      pointerEvents: 'none', background: BG, border: BORDER,
      borderRadius: '8px', padding: '10px 16px', boxShadow: SHADOW,
    });
    this.scoreEl = DIV(bottomLeft, {
      fontFamily: FONT, fontSize: '20px', fontWeight: 'bold', color: AMBER,
      marginBottom: '8px',
    });
    this.scoreEl.textContent = '\u{1F99E} Score: 0';

    this.cooldownLabel = DIV(bottomLeft, {
      fontFamily: FONT, fontSize: '13px', color: TEXT, marginBottom: '4px',
    });
    this.cooldownLabel.textContent = 'Net: Ready';

    this.cooldownBar = DIV(bottomLeft, {
      width: '140px', height: '10px', background: 'rgba(0,0,0,0.5)',
      borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(80,100,60,0.4)',
    });
    this.cooldownFill = DIV(this.cooldownBar, {
      width: '100%', height: '100%', background: '#4a2',
      borderRadius: '5px', transition: 'width 0.15s linear, background 0.3s',
    });

    const lbPanel = DIV(document.body, {
      position: 'fixed', top: '10px', right: '14px', zIndex: '10',
      pointerEvents: 'none', background: BG, border: BORDER,
      borderRadius: '8px', padding: '8px 14px', boxShadow: SHADOW,
      minWidth: '170px',
    });
    const lbHeader = DIV(lbPanel, {
      fontFamily: FONT, fontSize: '13px', color: AMBER, fontWeight: 'bold',
      borderBottom: '1px solid rgba(100,120,80,0.3)', paddingBottom: '5px',
      marginBottom: '5px',
    });
    this.lbCount = document.createElement('span');
    lbHeader.textContent = 'LEADERBOARD ';
    lbHeader.appendChild(this.lbCount);
    S(this.lbCount, { color: TEXT, fontWeight: 'normal', fontSize: '12px' });
    this.lbCount.textContent = '(0)';
    this.lbBody = DIV(lbPanel, {
      fontFamily: FONT, fontSize: '13px', color: TEXT, lineHeight: '1.7',
    });

    this.muteBtn = document.createElement('button');
    this.muteBtn.textContent = 'Sound: OFF';
    S(this.muteBtn, {
      position: 'fixed', bottom: '18px', right: '14px', zIndex: '10',
      padding: '7px 14px', fontSize: '13px', fontFamily: FONT,
      border: BORDER, borderRadius: '6px', cursor: 'pointer',
      background: BG, color: TEXT, boxShadow: SHADOW,
      transition: 'background 0.2s',
    });
    this.muteBtn.onmouseenter = () => S(this.muteBtn, { background: 'rgba(20,40,20,0.9)' });
    this.muteBtn.onmouseleave = () => S(this.muteBtn, { background: BG });
    document.body.appendChild(this.muteBtn);

    const hint = DIV(document.body, {
      position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
      zIndex: '10', pointerEvents: 'none', fontFamily: FONT, fontSize: '12px',
      color: 'rgba(224,216,200,0.6)', textAlign: 'center',
      transition: 'opacity 1.5s',
    });
    hint.textContent = 'WASD to move  |  SPACE to fire net  |  MMB/RMB to orbit camera';
    setTimeout(() => { hint.style.opacity = '0'; }, 10000);
  }

  updateTimer(seconds: number): void {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    this.timerEl.style.color = seconds <= 30 ? '#e04040' : seconds <= 60 ? AMBER : '#fff';
    this.timerEl.style.textShadow = seconds <= 30
      ? '0 0 14px rgba(224,64,64,0.6)' : '0 0 12px rgba(212,146,10,0.4)';
  }

  updateScore(score: number): void {
    this.scoreEl.textContent = `\u{1F99E} Score: ${score}`;
  }

  updateCooldown(cooldown: number): void {
    const ready = cooldown <= 0;
    const pct = ready ? 100 : Math.max(0, (1 - cooldown / NET_COOLDOWN) * 100);
    this.cooldownFill.style.width = `${pct}%`;
    this.cooldownFill.style.background = ready ? '#4a2' : '#a33';
    this.cooldownLabel.textContent = ready ? 'Net: Ready' : `Net: ${cooldown.toFixed(1)}s`;
    this.cooldownLabel.style.color = ready ? '#6c6' : '#e66';
  }

  updateLeaderboard(boats: BoatState[], localId: string): void {
    const sorted = [...boats].sort((a, b) => b.score - a.score);
    this.lbCount.textContent = `(${boats.length})`;
    this.lbBody.innerHTML = sorted.map((b, i) => {
      const me = b.id === localId;
      const c = me ? `color:${AMBER};font-weight:bold` : '';
      const tag = me ? ' \u25C0' : '';
      return `<div style="${c}">${i + 1}. ${b.name}: ${b.score}${tag}</div>`;
    }).join('');
  }
}
