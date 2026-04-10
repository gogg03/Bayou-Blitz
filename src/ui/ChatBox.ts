const BG = 'rgba(10,26,13,0.82)';
const BORDER = '1px solid rgba(100,120,80,0.35)';
const AMBER = '#d4920a';
const TEXT = '#e0d8c8';
const SERVER_COLOR = '#7a9a6e';
const FONT = "'Courier New', 'Consolas', monospace";
const SHADOW = '0 2px 8px rgba(0,0,0,0.6)';
const MAX_MESSAGES = 30;
const FADE_TIME = 10000;
const MAX_VISIBLE = 6;

interface ChatEntry {
  el: HTMLDivElement;
  timer: ReturnType<typeof setTimeout>;
}

export class ChatBox {
  static focused = false;
  static enabled = false;

  private container: HTMLDivElement;
  private messagesEl: HTMLDivElement;
  private inputEl: HTMLInputElement;
  private entries: ChatEntry[] = [];
  private onSendCb: ((text: string) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed', bottom: '120px', left: '18px', zIndex: '15',
      width: '320px', pointerEvents: 'none',
    });
    document.body.appendChild(this.container);

    this.messagesEl = document.createElement('div');
    Object.assign(this.messagesEl.style, {
      display: 'flex', flexDirection: 'column', gap: '3px',
      marginBottom: '6px', maxHeight: `${MAX_VISIBLE * 26}px`,
      overflow: 'hidden',
    });
    this.container.appendChild(this.messagesEl);

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.maxLength = 120;
    this.inputEl.placeholder = 'Press Enter to send, Esc to cancel';
    Object.assign(this.inputEl.style, {
      display: 'none', width: '100%', padding: '6px 10px',
      fontSize: '13px', fontFamily: FONT, borderRadius: '6px',
      border: BORDER, background: BG, color: TEXT, outline: 'none',
      boxShadow: SHADOW, boxSizing: 'border-box',
      pointerEvents: 'auto',
    });
    this.container.appendChild(this.inputEl);

    this.inputEl.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const text = this.inputEl.value.trim();
        if (text) this.onSendCb?.(text);
        this.closeInput();
      } else if (e.key === 'Escape') {
        this.closeInput();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!ChatBox.enabled || ChatBox.focused) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Enter' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        this.openInput();
      }
    });
  }

  private openInput(): void {
    this.inputEl.style.display = 'block';
    this.inputEl.value = '';
    this.inputEl.focus();
    ChatBox.focused = true;
  }

  private closeInput(): void {
    this.inputEl.style.display = 'none';
    this.inputEl.blur();
    ChatBox.focused = false;
  }

  addMessage(name: string, text: string, isServer = false): void {
    const el = document.createElement('div');
    Object.assign(el.style, {
      fontFamily: FONT, fontSize: '13px', lineHeight: '1.4',
      padding: '3px 8px', borderRadius: '4px',
      background: BG, transition: 'opacity 1s',
      wordBreak: 'break-word',
    });

    if (isServer) {
      el.innerHTML = `<span style="color:${SERVER_COLOR}">${this.esc(text)}</span>`;
    } else {
      el.innerHTML = `<span style="color:${AMBER};font-weight:bold">${this.esc(name)}</span>`
        + `<span style="color:${TEXT}">: ${this.esc(text)}</span>`;
    }

    this.messagesEl.appendChild(el);

    const timer = setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => this.removeEntry(el), 1200);
    }, FADE_TIME);

    this.entries.push({ el, timer });

    while (this.entries.length > MAX_MESSAGES) {
      const old = this.entries.shift()!;
      clearTimeout(old.timer);
      old.el.remove();
    }

    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private removeEntry(el: HTMLDivElement): void {
    el.remove();
    this.entries = this.entries.filter(e => e.el !== el);
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  onSend(cb: (text: string) => void): void {
    this.onSendCb = cb;
  }
}
