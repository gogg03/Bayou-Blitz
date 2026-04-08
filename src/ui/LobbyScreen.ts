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
    Object.assign(this.overlay.style, {
      position: 'fixed', inset: '0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0d2211 0%, #0a1a0d 60%, #060e07 100%)',
      zIndex: '100', fontFamily: "'Segoe UI', Arial, sans-serif",
    });

    const vignette = document.createElement('div');
    Object.assign(vignette.style, {
      position: 'absolute', inset: '0', pointerEvents: 'none',
      boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.7)',
    });
    this.overlay.appendChild(vignette);

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(10,20,12,0.6)', border: '1px solid rgba(212,146,10,0.15)',
      borderRadius: '16px', padding: '48px 56px 36px',
      backdropFilter: 'blur(8px)', position: 'relative', zIndex: '1',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    });
    this.overlay.appendChild(panel);

    const title = document.createElement('h1');
    title.textContent = 'BAYOU BLITZ';
    Object.assign(title.style, {
      color: '#d4920a', fontSize: '52px', margin: '0 0 4px', fontWeight: '900',
      letterSpacing: '6px', textShadow: '0 0 20px rgba(212,146,10,0.5), 0 4px 12px rgba(0,0,0,0.6)',
    });
    panel.appendChild(title);

    const tagline = document.createElement('p');
    tagline.textContent = 'Swamp Boat Brawl';
    Object.assign(tagline.style, {
      color: '#7a8a6e', fontSize: '16px', margin: '0 0 20px',
      letterSpacing: '3px', textTransform: 'uppercase' as string,
    });
    panel.appendChild(tagline);

    const flavor = document.createElement('p');
    flavor.textContent = 'Navigate the bayou. Collect crawfish. Dodge gators.';
    Object.assign(flavor.style, {
      color: '#9a9078', fontSize: '13px', margin: '0 0 28px',
      fontStyle: 'italic', opacity: '0.85',
    });
    panel.appendChild(flavor);

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Enter your name...';
    this.nameInput.maxLength = 16;
    Object.assign(this.nameInput.style, {
      padding: '14px 24px', fontSize: '17px', borderRadius: '10px',
      border: '2px solid #c47f08', background: 'rgba(19,46,23,0.8)', color: '#e0d8c8',
      outline: 'none', width: '260px', textAlign: 'center', marginBottom: '18px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    });
    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = '#d4920a';
      this.nameInput.style.boxShadow = '0 0 12px rgba(212,146,10,0.3)';
    });
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = '#c47f08';
      this.nameInput.style.boxShadow = 'none';
    });
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
    panel.appendChild(this.nameInput);

    this.modeBtn = document.createElement('button');
    this.modeBtn.textContent = 'MODE: NORMAL';
    Object.assign(this.modeBtn.style, {
      padding: '8px 24px', fontSize: '13px', fontWeight: '700',
      borderRadius: '8px', border: '1px solid rgba(196,127,8,0.4)', cursor: 'pointer',
      background: 'rgba(19,46,23,0.8)', color: '#c47f08', letterSpacing: '2px',
      marginBottom: '14px', transition: 'background 0.2s',
    });
    this.modeBtn.addEventListener('click', () => {
      this.mode = this.mode === 'normal' ? 'blitz' : 'normal';
      this.modeBtn.textContent = this.mode === 'blitz' ? 'MODE: BLITZ' : 'MODE: NORMAL';
      this.modeBtn.style.background = this.mode === 'blitz' ? 'rgba(120,30,10,0.6)' : 'rgba(19,46,23,0.8)';
    });
    panel.appendChild(this.modeBtn);

    this.joinBtn = document.createElement('button');
    this.joinBtn.textContent = 'LAUNCH BOAT';
    Object.assign(this.joinBtn.style, {
      padding: '14px 52px', fontSize: '17px', fontWeight: '800',
      borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: 'linear-gradient(180deg, #d4920a 0%, #a06b00 100%)',
      color: '#0a1a0d', letterSpacing: '2px', marginBottom: '16px',
      transition: 'filter 0.2s, transform 0.15s',
      boxShadow: '0 4px 16px rgba(212,146,10,0.25)',
    });
    this.joinBtn.addEventListener('mouseenter', () => {
      this.joinBtn.style.filter = 'brightness(1.15)';
      this.joinBtn.style.transform = 'translateY(-1px)';
    });
    this.joinBtn.addEventListener('mouseleave', () => {
      this.joinBtn.style.filter = 'brightness(1)';
      this.joinBtn.style.transform = 'translateY(0)';
    });
    this.joinBtn.addEventListener('mousedown', () => {
      this.joinBtn.style.filter = 'brightness(0.85)';
      this.joinBtn.style.transform = 'translateY(1px)';
    });
    this.joinBtn.addEventListener('mouseup', () => {
      this.joinBtn.style.filter = 'brightness(1.15)';
      this.joinBtn.style.transform = 'translateY(-1px)';
    });
    this.joinBtn.addEventListener('click', () => this.submit());
    panel.appendChild(this.joinBtn);

    this.statusEl = document.createElement('div');
    Object.assign(this.statusEl.style, {
      color: '#9a9078', fontSize: '14px', minHeight: '20px', marginBottom: '8px',
    });
    panel.appendChild(this.statusEl);

    const divider = document.createElement('div');
    Object.assign(divider.style, {
      width: '100%', height: '1px', margin: '12px 0 16px',
      background: 'linear-gradient(90deg, transparent, rgba(212,146,10,0.25), transparent)',
    });
    panel.appendChild(divider);

    const controlsWrap = document.createElement('div');
    Object.assign(controlsWrap.style, {
      display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap',
    });
    panel.appendChild(controlsWrap);

    const controls: [string, string][] = [
      ['WASD', 'Move'], ['SPACE', 'Fire Net'], ['MMB/RMB', 'Orbit Camera'],
    ];
    for (const [key, action] of controls) {
      const item = document.createElement('div');
      Object.assign(item.style, {
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
      });

      const badge = document.createElement('span');
      badge.textContent = key;
      Object.assign(badge.style, {
        background: 'rgba(212,146,10,0.15)', color: '#c47f08',
        padding: '3px 8px', borderRadius: '4px', fontWeight: '700',
        fontSize: '11px', letterSpacing: '1px', border: '1px solid rgba(196,127,8,0.3)',
      });
      item.appendChild(badge);

      const label = document.createElement('span');
      label.textContent = action;
      label.style.color = '#7a8a6e';
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
