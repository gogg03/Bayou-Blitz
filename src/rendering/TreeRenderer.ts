import * as THREE from 'three';
import { TILE_SIZE, TileType } from '../../shared/constants';

const TREE_HEIGHT = 36;
const TREE_WIDTH = 20;
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
    const w = TREE_WIDTH * scale * scale * 2;
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
    const cx = w / 2;

    // Buttressed trunk base — wide flare tapering up
    const trunkGrad = ctx.createLinearGradient(cx, h * 0.5, cx, h);
    trunkGrad.addColorStop(0, '#4a3520');
    trunkGrad.addColorStop(1, '#3b2a15');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 4, h * 0.5);
    ctx.lineTo(cx + 4, h * 0.5);
    ctx.lineTo(cx + 5, h * 0.75);
    ctx.lineTo(cx + 14, h * 0.88);
    ctx.lineTo(cx + 18, h);
    ctx.lineTo(cx - 18, h);
    ctx.lineTo(cx - 14, h * 0.88);
    ctx.lineTo(cx - 5, h * 0.75);
    ctx.closePath();
    ctx.fill();

    // Knees (root bumps at base)
    ctx.fillStyle = '#3b2a15';
    ctx.beginPath();
    ctx.ellipse(cx - 22, h * 0.96, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20, h * 0.97, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy — sparse, irregular foliage clusters at top
    const foliageColor = (dark: boolean) =>
      dark ? '#1b3a1b' : '#2a5423';
    const clusters = [
      { x: cx, y: h * 0.06, rx: 22, ry: 12 },
      { x: cx - 16, y: h * 0.12, rx: 28, ry: 14 },
      { x: cx + 18, y: h * 0.11, rx: 26, ry: 12 },
      { x: cx - 8, y: h * 0.20, rx: 34, ry: 16 },
      { x: cx + 12, y: h * 0.19, rx: 30, ry: 14 },
      { x: cx, y: h * 0.28, rx: 38, ry: 16 },
      { x: cx - 22, y: h * 0.31, rx: 24, ry: 12 },
      { x: cx + 24, y: h * 0.30, rx: 22, ry: 12 },
      { x: cx - 10, y: h * 0.38, rx: 32, ry: 14 },
      { x: cx + 14, y: h * 0.40, rx: 28, ry: 12 },
      { x: cx - 30, y: h * 0.25, rx: 18, ry: 10 },
      { x: cx + 32, y: h * 0.24, rx: 16, ry: 10 },
    ];
    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      ctx.fillStyle = foliageColor(i % 2 === 0);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spanish moss — thin wisps hanging from branches
    ctx.strokeStyle = 'rgba(140,160,120,0.5)';
    ctx.lineWidth = 1.5;
    const mossDrapes = [
      [cx - 30, h * 0.24, cx - 36, h * 0.40],
      [cx + 32, h * 0.22, cx + 38, h * 0.38],
      [cx - 18, h * 0.34, cx - 24, h * 0.48],
      [cx + 20, h * 0.36, cx + 26, h * 0.50],
      [cx - 36, h * 0.30, cx - 42, h * 0.44],
      [cx + 8, h * 0.42, cx + 6, h * 0.52],
      [cx - 6, h * 0.40, cx - 10, h * 0.52],
      [cx + 36, h * 0.28, cx + 40, h * 0.42],
    ];
    for (const [x1, y1, x2, y2] of mossDrapes) {
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
