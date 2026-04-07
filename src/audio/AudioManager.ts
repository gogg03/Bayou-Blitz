export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private muted = true;

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.3;
    this.masterGain.connect(this.ctx.destination);

    this.startAmbient();
    this.startEngine();
  }

  private startAmbient(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.06;
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    this.ambientOsc = osc;
  }

  private startEngine(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    this.engineOsc = osc;
    this.engineGain = gain;
  }

  updateEngine(speed: number): void {
    if (!this.engineOsc || !this.engineGain) return;
    const norm = Math.min(speed / 200, 1);
    this.engineOsc.frequency.value = 60 + norm * 140;
    this.engineGain.gain.value = 0.02 + norm * 0.12;
  }

  playSplash(): void {
    this.playNoise(0.15, 800, 0.08);
  }

  playGatorGrowl(): void {
    this.playTone(55, 'sawtooth', 0.3, 0.1);
  }

  playNetFire(): void {
    this.playTone(440, 'triangle', 0.1, 0.06);
  }

  private playNoise(duration: number, cutoff: number, volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    src.connect(filter).connect(gain).connect(this.masterGain);
    src.start();
  }

  private playTone(freq: number, type: OscillatorType, dur: number, vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
