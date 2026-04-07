export class HUD {
  private container: HTMLDivElement;
  private timerEl: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      zIndex: '10',
    });

    this.timerEl = document.createElement('div');
    Object.assign(this.timerEl.style, {
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '0 2px 6px rgba(0,0,0,0.7)',
      padding: '12px',
    });
    this.container.appendChild(this.timerEl);

    document.body.appendChild(this.container);
  }

  updateTimer(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    if (seconds <= 30) {
      this.timerEl.style.color = '#ff4444';
    } else if (seconds <= 60) {
      this.timerEl.style.color = '#ffaa00';
    } else {
      this.timerEl.style.color = '#ffffff';
    }
  }
}
