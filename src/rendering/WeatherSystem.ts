import * as THREE from 'three';

interface WeatherPreset {
  clearColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientColor: number;
  ambientIntensity: number;
  dirColor: number;
  dirIntensity: number;
  dirPosition: THREE.Vector3;
  rain: boolean;
  lightning: boolean;
}

const PRESETS: Record<string, WeatherPreset> = {
  day: {
    clearColor: 0x87ceeb, fogColor: 0x87ceeb, fogNear: 1800, fogFar: 3000,
    ambientColor: 0xffd59e, ambientIntensity: 0.6,
    dirColor: 0xffecd2, dirIntensity: 0.8,
    dirPosition: new THREE.Vector3(50, 100, 30),
    rain: false, lightning: false,
  },
  dusk: {
    clearColor: 0x2a1530, fogColor: 0x3a2040, fogNear: 1200, fogFar: 2600,
    ambientColor: 0xff8844, ambientIntensity: 0.35,
    dirColor: 0xff6633, dirIntensity: 0.5,
    dirPosition: new THREE.Vector3(-80, 30, 50),
    rain: false, lightning: false,
  },
  night: {
    clearColor: 0x050810, fogColor: 0x060a14, fogNear: 800, fogFar: 2000,
    ambientColor: 0x334466, ambientIntensity: 0.2,
    dirColor: 0x8899bb, dirIntensity: 0.25,
    dirPosition: new THREE.Vector3(30, 120, -20),
    rain: false, lightning: false,
  },
  fog: {
    clearColor: 0x667766, fogColor: 0x667766, fogNear: 200, fogFar: 900,
    ambientColor: 0xaabbaa, ambientIntensity: 0.5,
    dirColor: 0xccccbb, dirIntensity: 0.3,
    dirPosition: new THREE.Vector3(50, 80, 30),
    rain: false, lightning: false,
  },
  storm: {
    clearColor: 0x0a0e14, fogColor: 0x111822, fogNear: 600, fogFar: 1600,
    ambientColor: 0x445566, ambientIntensity: 0.25,
    dirColor: 0x556677, dirIntensity: 0.3,
    dirPosition: new THREE.Vector3(40, 60, 20),
    rain: true, lightning: true,
  },
  desert: {
    clearColor: 0xc8b888, fogColor: 0xc8b888, fogNear: 400, fogFar: 1400,
    ambientColor: 0xffe8b0, ambientIntensity: 0.75,
    dirColor: 0xfff4d6, dirIntensity: 1.1,
    dirPosition: new THREE.Vector3(10, 140, 10),
    rain: false, lightning: false,
  },
};

const RAIN_COUNT = 2000;
const RAIN_AREA = 800;
const RAIN_HEIGHT = 300;

export class WeatherSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private rainGroup: THREE.Group | null = null;
  private rainDrops: THREE.Vector3[] = [];
  private rainGeo: THREE.BufferGeometry | null = null;
  private currentWeather = '';
  private lightningTimer = 0;
  private lightningFlash = false;
  private followTarget: { x: number; z: number } | null = null;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.ambientLight = scene.children.find(
      c => c instanceof THREE.AmbientLight
    ) as THREE.AmbientLight;
    this.dirLight = scene.children.find(
      c => c instanceof THREE.DirectionalLight
    ) as THREE.DirectionalLight;
  }

  setFollowTarget(x: number, z: number): void {
    this.followTarget = { x, z };
  }

  setWeather(weather: string): void {
    if (weather === this.currentWeather) return;
    this.currentWeather = weather;
    const p = PRESETS[weather] ?? PRESETS.day;

    this.renderer.setClearColor(p.clearColor);
    (this.scene.fog as THREE.Fog).color.setHex(p.fogColor);
    (this.scene.fog as THREE.Fog).near = p.fogNear;
    (this.scene.fog as THREE.Fog).far = p.fogFar;

    this.ambientLight.color.setHex(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;
    this.dirLight.color.setHex(p.dirColor);
    this.dirLight.intensity = p.dirIntensity;
    this.dirLight.position.copy(p.dirPosition);

    if (p.rain) {
      this.createRain();
    } else {
      this.removeRain();
    }
  }

  update(dt: number): void {
    if (this.rainGroup && this.rainGeo) {
      const posAttr = this.rainGeo.getAttribute('position') as THREE.BufferAttribute;
      const cx = this.followTarget?.x ?? 0;
      const cz = this.followTarget?.z ?? 0;
      const half = RAIN_AREA / 2;

      for (let i = 0; i < this.rainDrops.length; i++) {
        const d = this.rainDrops[i];
        d.y -= 400 * dt;
        if (d.y < 0) {
          d.y = RAIN_HEIGHT;
          d.x = cx + (Math.random() - 0.5) * RAIN_AREA;
          d.z = cz + (Math.random() - 0.5) * RAIN_AREA;
        }
        posAttr.setXYZ(i, d.x, d.y, d.z);
      }
      posAttr.needsUpdate = true;
      this.rainGroup.position.set(0, 0, 0);
    }

    const p = PRESETS[this.currentWeather];
    if (p?.lightning) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningFlash = true;
        this.lightningTimer = 4 + Math.random() * 8;
        this.ambientLight.intensity = 2.0;
        this.dirLight.intensity = 3.0;
        setTimeout(() => {
          if (this.currentWeather === 'storm') {
            this.ambientLight.intensity = p.ambientIntensity;
            this.dirLight.intensity = p.dirIntensity;
          }
          this.lightningFlash = false;
        }, 80 + Math.random() * 120);
      }
    }
  }

  private createRain(): void {
    if (this.rainGroup) return;
    this.rainGroup = new THREE.Group();
    this.rainDrops = [];
    const positions = new Float32Array(RAIN_COUNT * 3);

    for (let i = 0; i < RAIN_COUNT; i++) {
      const x = (Math.random() - 0.5) * RAIN_AREA;
      const y = Math.random() * RAIN_HEIGHT;
      const z = (Math.random() - 0.5) * RAIN_AREA;
      this.rainDrops.push(new THREE.Vector3(x, y, z));
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    this.rainGeo = new THREE.BufferGeometry();
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xaabbcc, size: 1.5, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(this.rainGeo, mat);
    this.rainGroup.add(points);
    this.scene.add(this.rainGroup);
  }

  private removeRain(): void {
    if (!this.rainGroup) return;
    this.scene.remove(this.rainGroup);
    this.rainGeo?.dispose();
    this.rainGroup = null;
    this.rainGeo = null;
    this.rainDrops = [];
  }

  getWeather(): string { return this.currentWeather; }
}
