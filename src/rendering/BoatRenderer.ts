import * as THREE from 'three';

const HULL_L = 26;
const HULL_W = 14;
const HULL_H = 2;
const RAMP_L = 8;
const FAN_R = 7;
const BUBBLE_Y = HULL_H + 28;
const BUBBLE_DURATION = 6000;

interface SpeechBubble {
  sprite: THREE.Sprite;
  timer: ReturnType<typeof setTimeout>;
  fadeTimer?: ReturnType<typeof setTimeout>;
}

export class BoatRenderer {
  private scene: THREE.Scene;
  private boatMeshes: Map<string, THREE.Group> = new Map();
  private fanGroups: Map<string, THREE.Group> = new Map();
  private headlights: Map<string, THREE.SpotLight> = new Map();
  private bubbles: Map<string, SpeechBubble> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createBoat(id: string, color: number = 0xb0b0b0, name?: string, isLocal = false): THREE.Group {
    const group = new THREE.Group();
    const cDark = new THREE.Color(color).multiplyScalar(0.7);

    const hullGeo = new THREE.BoxGeometry(HULL_W, HULL_H, HULL_L);
    const hullMat = new THREE.MeshStandardMaterial({ color });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = HULL_H / 2 + 0.3;
    group.add(hull);

    const rampGeo = new THREE.BoxGeometry(HULL_W, HULL_H * 0.6, RAMP_L);
    const ramp = new THREE.Mesh(rampGeo, hullMat);
    ramp.position.set(0, HULL_H * 0.5 + 0.3, -(HULL_L / 2 + RAMP_L / 2 - 2));
    ramp.rotation.x = 0.35;
    group.add(ramp);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 });
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, HULL_L * 0.7), railMat);
      rail.position.set(side * (HULL_W / 2 - 0.5), HULL_H + 1.3, -2);
      group.add(rail);
    }

    const platGeo = new THREE.BoxGeometry(HULL_W * 0.7, 0.8, 8);
    const platMat = new THREE.MeshStandardMaterial({ color: cDark });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.set(0, HULL_H + 2.2, HULL_L / 2 - 6);
    group.add(plat);

    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    seatBase.position.set(0, HULL_H + 3.8, HULL_L / 2 - 6);
    group.add(seatBase);
    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    seatBack.position.set(0, HULL_H + 5.5, HULL_L / 2 - 4.5);
    group.add(seatBack);

    const cageGeo = new THREE.TorusGeometry(FAN_R, 0.4, 8, 24);
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    cage.position.set(0, HULL_H + 5.5, HULL_L / 2 + 1);
    group.add(cage);

    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, HULL_H + 5.5, HULL_L / 2 + 1);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x999999, metalness: 0.5, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(2, FAN_R * 1.8), bladeMat);
      blade.rotation.set(0, 0, (Math.PI / 3) * i);
      fanGroup.add(blade);
    }
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1, 8), cageMat
    );
    hub.rotation.x = Math.PI / 2;
    fanGroup.add(hub);
    group.add(fanGroup);

    for (const side of [-1, 1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5), railMat);
      strut.position.set(side * 4, HULL_H + 3, HULL_L / 2);
      group.add(strut);
    }
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 0.5), railMat);
    crossbar.position.set(0, HULL_H + 6.2, HULL_L / 2);
    group.add(crossbar);

    if (isLocal) {
      const headlight = new THREE.SpotLight(0xfff4d6, 120, 400, 0.45, 0.5, 1);
      headlight.position.set(0, HULL_H + 3, -(HULL_L / 2));
      const lightTarget = new THREE.Object3D();
      lightTarget.position.set(0, -2, -(HULL_L / 2 + 150));
      group.add(lightTarget);
      headlight.target = lightTarget;
      headlight.visible = false;
      group.add(headlight);
      this.headlights.set(id, headlight);
    }

    if (name) {
      const label = this.createLabel(name);
      label.position.set(0, HULL_H + 16, 0);
      group.add(label);
    }

    this.scene.add(group);
    this.boatMeshes.set(id, group);
    this.fanGroups.set(id, fanGroup);
    return group;
  }

  private createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 128, 40);
    ctx.fillText(text, 128, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(32, 8, 1);
    return sprite;
  }

  updateBoat(id: string, x: number, z: number, rotation: number): void {
    const group = this.boatMeshes.get(id);
    if (!group) return;
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
  }

  spinFans(dt: number): void {
    for (const fan of this.fanGroups.values()) {
      fan.rotation.z += 12 * dt;
    }
  }

  setHeadlights(on: boolean): void {
    for (const light of this.headlights.values()) {
      light.visible = on;
    }
  }

  showBubble(id: string, text: string): void {
    const group = this.boatMeshes.get(id);
    if (!group) return;

    this.clearBubble(id);

    const sprite = this.createBubbleSprite(text);
    sprite.position.set(0, BUBBLE_Y, 0);
    group.add(sprite);

    const fadeTimer = setTimeout(() => {
      sprite.material.opacity = 0;
    }, BUBBLE_DURATION - 800);

    const timer = setTimeout(() => {
      group.remove(sprite);
      sprite.material.dispose();
      (sprite.material.map as THREE.Texture)?.dispose();
      this.bubbles.delete(id);
    }, BUBBLE_DURATION);

    this.bubbles.set(id, { sprite, timer, fadeTimer });
  }

  private clearBubble(id: string): void {
    const existing = this.bubbles.get(id);
    if (!existing) return;
    clearTimeout(existing.timer);
    if (existing.fadeTimer) clearTimeout(existing.fadeTimer);
    const group = this.boatMeshes.get(id);
    if (group) group.remove(existing.sprite);
    existing.sprite.material.dispose();
    (existing.sprite.material.map as THREE.Texture)?.dispose();
    this.bubbles.delete(id);
  }

  private createBubbleSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 28;
    const pad = 16;
    const tailH = 10;
    ctx.font = `bold ${fontSize}px Arial`;

    const lines = this.wrapText(ctx, text, 300);
    const lineH = fontSize + 4;
    const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const boxW = textW + pad * 2;
    const boxH = lines.length * lineH + pad * 2;

    canvas.width = Math.ceil(boxW);
    canvas.height = Math.ceil(boxH + tailH);

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(10, 26, 13, 0.88)';
    this.roundRect(ctx, 0, 0, boxW, boxH, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(212, 146, 10, 0.6)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 0, 0, boxW, boxH, 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boxW / 2 - 8, boxH);
    ctx.lineTo(boxW / 2, boxH + tailH);
    ctx.lineTo(boxW / 2 + 8, boxH);
    ctx.fillStyle = 'rgba(10, 26, 13, 0.88)';
    ctx.fill();

    ctx.fillStyle = '#e0d8c8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], boxW / 2, pad + i * lineH);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: texture, transparent: true, depthTest: false,
      opacity: 1,
    });
    mat.opacity = 1;
    const sprite = new THREE.Sprite(mat);
    const aspect = canvas.width / canvas.height;
    const spriteH = 14;
    sprite.scale.set(spriteH * aspect, spriteH, 1);
    return sprite;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  removeBoat(id: string): void {
    this.clearBubble(id);
    const group = this.boatMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      this.boatMeshes.delete(id);
      this.fanGroups.delete(id);
      this.headlights.delete(id);
    }
  }

  getBoatMesh(id: string): THREE.Group | undefined {
    return this.boatMeshes.get(id);
  }
}
