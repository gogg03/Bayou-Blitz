const S = (el: HTMLElement, s: Partial<CSSStyleDeclaration>) => Object.assign(el.style, s);

const AMBER = '#d4920a';
const AMBER_DIM = 'rgba(212,146,10,0.15)';
const AMBER_BORDER = 'rgba(196,127,8,0.35)';
const PANEL_BG = 'rgba(8,18,10,0.85)';
const INPUT_BG = 'rgba(16,38,20,0.9)';
const TEXT_MUTED = '#7a8a6e';
const TEXT_WARM = '#9a9078';
const TEXT_LIGHT = '#e0d8c8';
const FONT = "'Segoe UI', Arial, sans-serif";

export class LobbyScreen {
  private overlay: HTMLDivElement;
  private nameInput: HTMLInputElement;
  private joinBtn: HTMLButtonElement;
  private statusEl: HTMLDivElement;
  private mode: 'normal' | 'blitz' = 'normal';
  private modeBtn: HTMLButtonElement;
  private onJoin: ((name: string, mode: string) => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    S(this.overlay, {
      position: 'fixed', inset: '0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0d2211 0%, #0a1a0d 60%, #060e07 100%)',
      zIndex: '100', fontFamily: FONT, overflow: 'auto',
    });

    const vignette = document.createElement('div');
    S(vignette, {
      position: 'absolute', inset: '0', pointerEvents: 'none',
      boxShadow: 'inset 0 0 180px 80px rgba(0,0,0,0.75)',
    });
    this.overlay.appendChild(vignette);

    const panel = document.createElement('div');
    S(panel, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: PANEL_BG,
      border: `1px solid ${AMBER_BORDER}`,
      borderRadius: '16px',
      padding: '0',
      backdropFilter: 'blur(10px)', position: 'relative', zIndex: '1',
      boxShadow: `0 0 60px rgba(0,0,0,0.6), 0 0 20px rgba(212,146,10,0.08)`,
      maxWidth: '560px', width: '92%', overflow: 'hidden',
    });
    this.overlay.appendChild(panel);

    // --- Hero banner ---
    const heroWrap = document.createElement('div');
    S(heroWrap, {
      width: '100%', position: 'relative', overflow: 'hidden',
    });
    panel.appendChild(heroWrap);

    const heroImg = document.createElement('img');
    heroImg.src = '/bayou-blitz-hero.png';
    heroImg.alt = 'Bayou Blitz';
    heroImg.draggable = false;
    S(heroImg, {
      width: '100%', display: 'block', objectFit: 'cover',
    });
    heroWrap.appendChild(heroImg);

    const heroFade = document.createElement('div');
    S(heroFade, {
      position: 'absolute', bottom: '0', left: '0', right: '0', height: '50px',
      background: `linear-gradient(to top, ${PANEL_BG}, transparent)`,
      pointerEvents: 'none',
    });
    heroWrap.appendChild(heroFade);

    // --- Content ---
    const content = document.createElement('div');
    S(content, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 44px 28px', width: '100%', boxSizing: 'border-box',
    });
    panel.appendChild(content);

    const flavor = document.createElement('p');
    flavor.textContent = 'Navigate the bayou. Collect crawfish. Dodge gators.';
    S(flavor, {
      color: TEXT_WARM, fontSize: '13px', margin: '0 0 22px',
      fontStyle: 'italic', opacity: '0.85', textAlign: 'center',
      letterSpacing: '0.5px',
    });
    content.appendChild(flavor);

    // --- Name input ---
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Enter your name...';
    this.nameInput.maxLength = 16;
    S(this.nameInput, {
      padding: '13px 24px', fontSize: '16px', borderRadius: '8px',
      border: `2px solid ${AMBER_BORDER}`, background: INPUT_BG, color: TEXT_LIGHT,
      outline: 'none', width: '100%', textAlign: 'center', marginBottom: '12px',
      transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
    });
    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = AMBER;
      this.nameInput.style.boxShadow = '0 0 14px rgba(212,146,10,0.3)';
    });
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = AMBER_BORDER;
      this.nameInput.style.boxShadow = 'none';
    });
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
    content.appendChild(this.nameInput);

    // --- Mode + Launch row ---
    const actionRow = document.createElement('div');
    S(actionRow, {
      display: 'flex', gap: '10px', width: '100%', marginBottom: '12px',
    });
    content.appendChild(actionRow);

    this.modeBtn = document.createElement('button');
    this.modeBtn.textContent = 'NORMAL';
    S(this.modeBtn, {
      padding: '12px 0', fontSize: '13px', fontWeight: '700',
      borderRadius: '8px', border: `1px solid ${AMBER_BORDER}`, cursor: 'pointer',
      background: INPUT_BG, color: '#c47f08', letterSpacing: '2px',
      transition: 'background 0.2s, border-color 0.2s', flex: '0 0 110px',
    });
    this.modeBtn.addEventListener('click', () => {
      this.mode = this.mode === 'normal' ? 'blitz' : 'normal';
      this.modeBtn.textContent = this.mode === 'blitz' ? 'BLITZ' : 'NORMAL';
      if (this.mode === 'blitz') {
        S(this.modeBtn, { background: 'rgba(140,35,10,0.5)', borderColor: '#c44020' });
      } else {
        S(this.modeBtn, { background: INPUT_BG, borderColor: AMBER_BORDER });
      }
    });
    actionRow.appendChild(this.modeBtn);

    this.joinBtn = document.createElement('button');
    this.joinBtn.textContent = 'LAUNCH BOAT';
    S(this.joinBtn, {
      padding: '12px 0', fontSize: '16px', fontWeight: '800', flex: '1',
      borderRadius: '8px', border: 'none', cursor: 'pointer',
      background: `linear-gradient(180deg, ${AMBER} 0%, #a06b00 100%)`,
      color: '#0a1a0d', letterSpacing: '2px',
      transition: 'filter 0.2s, transform 0.15s',
      boxShadow: '0 3px 12px rgba(212,146,10,0.3)',
    });
    this.joinBtn.addEventListener('mouseenter', () => {
      S(this.joinBtn, { filter: 'brightness(1.15)', transform: 'translateY(-1px)' });
    });
    this.joinBtn.addEventListener('mouseleave', () => {
      S(this.joinBtn, { filter: 'brightness(1)', transform: 'translateY(0)' });
    });
    this.joinBtn.addEventListener('mousedown', () => {
      S(this.joinBtn, { filter: 'brightness(0.85)', transform: 'translateY(1px)' });
    });
    this.joinBtn.addEventListener('mouseup', () => {
      S(this.joinBtn, { filter: 'brightness(1.15)', transform: 'translateY(-1px)' });
    });
    this.joinBtn.addEventListener('click', () => this.submit());
    actionRow.appendChild(this.joinBtn);

    // --- Status ---
    this.statusEl = document.createElement('div');
    S(this.statusEl, {
      color: TEXT_WARM, fontSize: '14px', minHeight: '20px',
      textAlign: 'center',
    });
    content.appendChild(this.statusEl);

    // --- Divider ---
    const divider = document.createElement('div');
    S(divider, {
      width: '100%', height: '1px', margin: '8px 0 12px',
      background: `linear-gradient(90deg, transparent, rgba(212,146,10,0.2), transparent)`,
    });
    content.appendChild(divider);

    // --- Controls ---
    const controlsWrap = document.createElement('div');
    S(controlsWrap, {
      display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap',
    });
    content.appendChild(controlsWrap);

    const controls: [string, string][] = [
      ['WASD', 'Move'], ['SPACE', 'Fire Net'],
      ['MMB/RMB', 'Orbit'], ['T', 'Chat'],
    ];
    for (const [key, action] of controls) {
      const item = document.createElement('div');
      S(item, {
        display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px',
      });

      const badge = document.createElement('span');
      badge.textContent = key;
      S(badge, {
        background: AMBER_DIM, color: '#c47f08',
        padding: '2px 7px', borderRadius: '4px', fontWeight: '700',
        fontSize: '10px', letterSpacing: '1px',
        border: `1px solid rgba(196,127,8,0.25)`,
      });
      item.appendChild(badge);

      const label = document.createElement('span');
      label.textContent = action;
      label.style.color = TEXT_MUTED;
      item.appendChild(label);

      controlsWrap.appendChild(item);
    }

    document.body.appendChild(this.overlay);
    this.nameInput.focus();
  }

  private submit(): void {
    const name = this.nameInput.value.trim() || 'Player';
    this.joinBtn.disabled = true;
    this.joinBtn.style.opacity = '0.6';
    this.joinBtn.style.cursor = 'default';
    this.statusEl.textContent = 'Connecting...';
    this.onJoin?.(name, this.mode);
  }

  onJoinGame(callback: (name: string, mode: string) => void): void {
    this.onJoin = callback;
  }

  updateStatus(text: string): void {
    this.statusEl.textContent = text;
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }

  show(): void {
    this.overlay.style.display = 'flex';
    this.joinBtn.disabled = false;
    this.joinBtn.style.opacity = '1';
    this.joinBtn.style.cursor = 'pointer';
    this.statusEl.textContent = '';
  }
}
