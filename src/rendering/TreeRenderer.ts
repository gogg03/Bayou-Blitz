import * as THREE from 'three';
import { TILE_SIZE, TileType } from '../../shared/constants';

const TREE_HEIGHT = 28;
const TREE_WIDTH = 14;
const TREE_SPACING = 48;

export class TreeRenderer {
  private scene: THREE.Scene;
  private treeGroup: THREE.Group;
  private texture: THREE.CanvasTexture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);
    this.texture = this.createCypressTexture();
  }

  placeAlongEdges(tiles: TileType[][]): void {
    this.clear();
    const rows = tiles.length;
    const cols = tiles[0].length;
    const ox = -(cols * TILE_SIZE) / 2;
    const oz = -(rows * TILE_SIZE) / 2;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const placed = new Set<string>();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = tiles[row][col];
        if (t !== TileType.LAND && t !== TileType.REED_WALL) continue;

        for (const [dr, dc] of dirs) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const nt = tiles[nr][nc];
          if (nt === TileType.LAND || nt === TileType.REED_WALL) continue;

          const ex = ox + col * TILE_SIZE + TILE_SIZE / 2 + dc * (TILE_SIZE / 2);
          const ez = oz + row * TILE_SIZE + TILE_SIZE / 2 + dr * (TILE_SIZE / 2);

          const gx = Math.round(ex / TREE_SPACING);
          const gz = Math.round(ez / TREE_SPACING);
          const key = `${gx},${gz}`;
          if (placed.has(key)) continue;
          placed.add(key);

          const sx = gx * TREE_SPACING + (this.hash(gx, gz) % 10 - 5);
          const sz = gz * TREE_SPACING + (this.hash(gz, gx) % 10 - 5);
          const scale = 0.8 + (this.hash(gx + gz, gx - gz) % 5) / 10;
          this.addTree(sx, sz, scale);
        }
      }
    }
  }

  private addTree(x: number, z: number, scale: number): void {
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture, transparent: true, alphaTest: 0.3,
      side: THREE.DoubleSide, depthWrite: true,
    });

    const h = TREE_HEIGHT * scale;
    const w = TREE_WIDTH * scale;
    const geo = new THREE.PlaneGeometry(w, h);

    const p1 = new THREE.Mesh(geo, mat);
    p1.position.set(x, 2.5 + h / 2, z);

    const p2 = new THREE.Mesh(geo, mat.clone());
    p2.position.set(x, 2.5 + h / 2, z);
    p2.rotation.y = Math.PI / 2;

    this.treeGroup.add(p1);
    this.treeGroup.add(p2);
  }

  private createCypressTexture(): THREE.CanvasTexture {
    const w = 128;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#3b2510';
    ctx.fillRect(w / 2 - 4, h * 0.55, 8, h * 0.45);

    const cx = w / 2;
    const grad = ctx.createLinearGradient(cx, h * 0.05, cx, h * 0.6);
    grad.addColorStop(0, '#1a3d1a');
    grad.addColorStop(0.5, '#2d5a27');
    grad.addColorStop(1, '#1f4420');

    ctx.beginPath();
    ctx.moveTo(cx, h * 0.02);
    ctx.lineTo(cx + 8, h * 0.15);
    ctx.lineTo(cx + 18, h * 0.25);
    ctx.lineTo(cx + 12, h * 0.28);
    ctx.lineTo(cx + 24, h * 0.38);
    ctx.lineTo(cx + 16, h * 0.42);
    ctx.lineTo(cx + 28, h * 0.52);
    ctx.lineTo(cx + 10, h * 0.56);
    ctx.lineTo(cx - 10, h * 0.56);
    ctx.lineTo(cx - 28, h * 0.52);
    ctx.lineTo(cx - 16, h * 0.42);
    ctx.lineTo(cx - 24, h * 0.38);
    ctx.lineTo(cx - 12, h * 0.28);
    ctx.lineTo(cx - 18, h * 0.25);
    ctx.lineTo(cx - 8, h * 0.15);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = 'rgba(80,90,50,0.4)';
    for (let i = 0; i < 6; i++) {
      const mx = cx + (i % 2 === 0 ? 1 : -1) * (10 + i * 3);
      const my = h * (0.35 + i * 0.03);
      ctx.beginPath();
      ctx.ellipse(mx, my, 12, 2, (i % 2) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  private hash(a: number, b: number): number {
    let h = (a * 2654435761 + b * 40503) | 0;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    return Math.abs(h) % 1000;
  }

  clear(): void {
    while (this.treeGroup.children.length > 0) {
      const child = this.treeGroup.children[0];
      this.treeGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
  }
}
