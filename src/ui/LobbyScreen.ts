export class LobbyScreen {
  private overlay: HTMLDivElement;
  private nameInput: HTMLInputElement;
  private joinBtn: HTMLButtonElement;
  private statusEl: HTMLDivElement;
  private onJoin: ((name: string) => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', inset: '0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,26,13,0.92)', zIndex: '100', fontFamily: "'Segoe UI', Arial, sans-serif",
    });

    const title = document.createElement('h1');
    title.textContent = 'Bayou Blitz';
    Object.assign(title.style, {
      color: '#ff9900', fontSize: '56px', marginBottom: '8px',
      textShadow: '0 4px 12px rgba(0,0,0,0.6)', letterSpacing: '2px',
    });
    this.overlay.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Swamp Boat Brawl';
    Object.assign(subtitle.style, {
      color: '#aaa', fontSize: '18px', marginBottom: '32px',
    });
    this.overlay.appendChild(subtitle);

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Enter your name...';
    this.nameInput.maxLength = 16;
    Object.assign(this.nameInput.style, {
      padding: '12px 20px', fontSize: '18px', borderRadius: '8px',
      border: '2px solid #ff9900', background: '#1a2e1a', color: '#fff',
      outline: 'none', width: '260px', textAlign: 'center', marginBottom: '16px',
    });
    this.overlay.appendChild(this.nameInput);

    this.joinBtn = document.createElement('button');
    this.joinBtn.textContent = 'Join Game';
    Object.assign(this.joinBtn.style, {
      padding: '12px 40px', fontSize: '18px', fontWeight: 'bold',
      borderRadius: '8px', border: 'none', cursor: 'pointer',
      background: '#ff9900', color: '#000', marginBottom: '20px',
    });
    this.joinBtn.addEventListener('click', () => this.submit());
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
    this.overlay.appendChild(this.joinBtn);

    this.statusEl = document.createElement('div');
    Object.assign(this.statusEl.style, { color: '#ccc', fontSize: '14px' });
    this.overlay.appendChild(this.statusEl);

    document.body.appendChild(this.overlay);
    this.nameInput.focus();
  }

  private submit(): void {
    const name = this.nameInput.value.trim() || 'Player';
    this.joinBtn.disabled = true;
    this.statusEl.textContent = 'Connecting...';
    this.onJoin?.(name);
  }

  onJoinGame(callback: (name: string) => void): void {
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
    this.statusEl.textContent = '';
  }
}
