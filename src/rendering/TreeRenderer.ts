import * as THREE from 'three';
import { TILE_SIZE, TileType } from '../../shared/constants';

const BASE_HEIGHT = 32;
const BASE_WIDTH = 16;
const PLACE_CHANCE = 0.45;
const MIN_DIST_SQ = 20 * 20;

export class TreeRenderer {
  private scene: THREE.Scene;
  private treeGroup: THREE.Group;
  private texture: THREE.CanvasTexture;
  private sharedMat: THREE.MeshLambertMaterial;
  private sharedGeo: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);
    this.texture = this.createCypressTexture();
    this.sharedGeo = new THREE.PlaneGeometry(1, 1);
    this.sharedMat = new THREE.MeshLambertMaterial({
      map: this.texture, transparent: true, alphaTest: 0.3,
      side: THREE.DoubleSide, depthWrite: true,
    });
  }

  placeAlongEdges(tiles: TileType[][]): void {
    this.clear();
    const rows = tiles.length;
    const cols = tiles[0].length;
    const ox = -(cols * TILE_SIZE) / 2;
    const oz = -(rows * TILE_SIZE) / 2;
    const placed: { x: number; z: number }[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = tiles[row][col];
        if (t !== TileType.LAND && t !== TileType.REED_WALL) continue;
        if (!this.bordersWater(tiles, row, col, rows, cols)) continue;

        const seed = this.hash(row * 7919, col * 6271);
        if ((seed % 100) / 100 >= PLACE_CHANCE) continue;

        const cx = ox + col * TILE_SIZE + TILE_SIZE / 2;
        const cz = oz + row * TILE_SIZE + TILE_SIZE / 2;
        const jx = ((this.hash(row, col * 3) % 100) - 50) / 50 * TILE_SIZE * 0.4;
        const jz = ((this.hash(col, row * 3) % 100) - 50) / 50 * TILE_SIZE * 0.4;
        const tx = cx + jx;
        const tz = cz + jz;

        if (this.tooClose(placed, tx, tz)) continue;
        placed.push({ x: tx, z: tz });

        const scale = 0.6 + (this.hash(row + col, row * col) % 80) / 100;
        this.addTree(tx, tz, scale);
      }
    }
  }

  private bordersWater(
    tiles: TileType[][], r: number, c: number, rows: number, cols: number
  ): boolean {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nt = tiles[nr][nc];
        if (nt === TileType.WATER || nt === TileType.GATOR_ZONE) return true;
      }
    }
    return false;
  }

  private tooClose(placed: { x: number; z: number }[], x: number, z: number): boolean {
    for (const p of placed) {
      const dx = p.x - x;
      const dz = p.z - z;
      if (dx * dx + dz * dz < MIN_DIST_SQ) return true;
    }
    return false;
  }

  private addTree(x: number, z: number, scale: number): void {
    const h = BASE_HEIGHT * scale;
    const w = BASE_WIDTH * scale * scale * 2;

    const p1 = new THREE.Mesh(this.sharedGeo, this.sharedMat);
    p1.position.set(x, 2.5 + h / 2, z);
    p1.scale.set(w, h, 1);

    const p2 = new THREE.Mesh(this.sharedGeo, this.sharedMat);
    p2.position.set(x, 2.5 + h / 2, z);
    p2.rotation.y = Math.PI / 2;
    p2.scale.set(w, h, 1);

    this.treeGroup.add(p1, p2);
  }

  private createCypressTexture(): THREE.CanvasTexture {
    const w = 128, h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;

    const trunkGrad = ctx.createLinearGradient(cx, h * 0.3, cx, h);
    trunkGrad.addColorStop(0, '#2a1a0c');
    trunkGrad.addColorStop(1, '#1f1308');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 2, h * 0.3);
    ctx.lineTo(cx + 2, h * 0.3);
    ctx.lineTo(cx + 5, h * 0.75);
    ctx.lineTo(cx + 14, h * 0.88);
    ctx.lineTo(cx + 18, h);
    ctx.lineTo(cx - 18, h);
    ctx.lineTo(cx - 14, h * 0.88);
    ctx.lineTo(cx - 5, h * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1f1308';
    ctx.beginPath();
    ctx.ellipse(cx - 22, h * 0.96, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20, h * 0.97, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const dark = '#0d1f0d';
    const mid = '#142a14';
    const clusters = [
      { x: cx, y: h * 0.06, rx: 22, ry: 12, c: dark },
      { x: cx - 16, y: h * 0.12, rx: 28, ry: 14, c: mid },
      { x: cx + 18, y: h * 0.11, rx: 26, ry: 12, c: dark },
      { x: cx - 8, y: h * 0.20, rx: 34, ry: 16, c: mid },
      { x: cx + 12, y: h * 0.19, rx: 30, ry: 14, c: dark },
      { x: cx, y: h * 0.28, rx: 38, ry: 16, c: mid },
      { x: cx - 22, y: h * 0.31, rx: 24, ry: 12, c: dark },
      { x: cx + 24, y: h * 0.30, rx: 22, ry: 12, c: mid },
      { x: cx - 10, y: h * 0.38, rx: 32, ry: 14, c: dark },
      { x: cx + 14, y: h * 0.40, rx: 28, ry: 12, c: mid },
      { x: cx - 30, y: h * 0.25, rx: 18, ry: 10, c: dark },
      { x: cx + 32, y: h * 0.24, rx: 16, ry: 10, c: dark },
      { x: cx, y: h * 0.46, rx: 24, ry: 12, c: dark },
      { x: cx - 12, y: h * 0.50, rx: 18, ry: 10, c: mid },
      { x: cx + 10, y: h * 0.48, rx: 20, ry: 10, c: dark },
    ];
    for (const cl of clusters) {
      ctx.fillStyle = cl.c;
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(80,90,70,0.4)';
    ctx.lineWidth = 1.5;
    const moss = [
      [cx - 30, h * 0.24, cx - 36, h * 0.40],
      [cx + 32, h * 0.22, cx + 38, h * 0.38],
      [cx - 18, h * 0.34, cx - 24, h * 0.48],
      [cx + 20, h * 0.36, cx + 26, h * 0.50],
      [cx - 36, h * 0.30, cx - 42, h * 0.44],
      [cx + 8, h * 0.42, cx + 6, h * 0.52],
      [cx - 6, h * 0.40, cx - 10, h * 0.52],
      [cx + 36, h * 0.28, cx + 40, h * 0.42],
    ];
    for (const [x1, y1, x2, y2] of moss) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(x1 + (x2 - x1) * 0.3, (y1 + y2) / 2 + 4, x2, y2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  private hash(a: number, b: number): number {
    let v = (a * 2654435761 + b * 40503) | 0;
    v = ((v >> 16) ^ v) * 0x45d9f3b;
    return Math.abs(v) % 10000;
  }

  clear(): void {
    this.treeGroup.clear();
  }
}
