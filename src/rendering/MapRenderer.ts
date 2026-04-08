import * as THREE from 'three';
import { TILE_SIZE, TileType, TILE_COLORS } from '../constants/GameConfig';

export class MapRenderer {
  private mapGroup: THREE.Group;
  private scene: THREE.Scene;
  private rendered = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mapGroup = new THREE.Group();
    this.scene.add(this.mapGroup);
  }

  hasRendered(): boolean {
    return this.rendered;
  }

  renderMap(tiles: TileType[][]): void {
    this.rendered = true;
    this.clear();

    const rows = tiles.length;
    const cols = tiles[0].length;
    const offsetX = -(cols * TILE_SIZE) / 2;
    const offsetZ = -(rows * TILE_SIZE) / 2;

    const geometriesByType = new Map<TileType, THREE.BufferGeometry[]>();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileType = tiles[row][col];
        if (!geometriesByType.has(tileType)) {
          geometriesByType.set(tileType, []);
        }

        const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        geo.rotateX(-Math.PI / 2);
        geo.translate(
          offsetX + col * TILE_SIZE + TILE_SIZE / 2,
          this.getYForType(tileType),
          offsetZ + row * TILE_SIZE + TILE_SIZE / 2
        );
        geometriesByType.get(tileType)!.push(geo);
      }
    }

    for (const [tileType, geos] of geometriesByType) {
      if (geos.length === 0) continue;
      const merged = this.mergeGeometries(geos);
      const material = new THREE.MeshStandardMaterial({
        color: TILE_COLORS[tileType],
      });
      const mesh = new THREE.Mesh(merged, material);
      this.mapGroup.add(mesh);

      for (const g of geos) g.dispose();
    }

    this.addBumpers(tiles, rows, cols, offsetX, offsetZ);
  }

  private isSolid(type: TileType): boolean {
    return type === TileType.LAND || type === TileType.REED_WALL;
  }

  private addBumpers(
    tiles: TileType[][], rows: number, cols: number,
    offsetX: number, offsetZ: number
  ): void {
    const bumperGeos: THREE.BufferGeometry[] = [];
    const h = 1.5;
    const thickness = 1.5;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!this.isSolid(tiles[row][col])) continue;
        const cx = offsetX + col * TILE_SIZE + TILE_SIZE / 2;
        const cz = offsetZ + row * TILE_SIZE + TILE_SIZE / 2;

        for (const [dr, dc] of dirs) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (this.isSolid(tiles[nr][nc])) continue;

          const geo = new THREE.BoxGeometry(
            dc === 0 ? TILE_SIZE : thickness,
            h,
            dr === 0 ? TILE_SIZE : thickness
          );
          geo.translate(
            cx + dc * (TILE_SIZE / 2),
            h / 2,
            cz + dr * (TILE_SIZE / 2)
          );
          bumperGeos.push(geo);
        }
      }
    }

    if (bumperGeos.length === 0) return;
    const merged = this.mergeGeometries(bumperGeos);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
    this.mapGroup.add(new THREE.Mesh(merged, mat));
    for (const g of bumperGeos) g.dispose();
  }

  private getYForType(type: TileType): number {
    switch (type) {
      case TileType.DOCK:
        return 0.2;
      case TileType.LAND:
      case TileType.REED_WALL:
        return 2.5;
      case TileType.GATOR_ZONE:
        return -0.05;
      default:
        return 0;
    }
  }

  private mergeGeometries(
    geometries: THREE.BufferGeometry[]
  ): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    let indexOffset = 0;
    const indices: number[] = [];

    for (const geo of geometries) {
      const pos = geo.getAttribute('position');
      const norm = geo.getAttribute('normal');
      const idx = geo.getIndex();

      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }

      if (idx) {
        const idxArray = idx.array;
        for (let i = 0; i < idx.count; i++) {
          indices.push(idxArray[i] + indexOffset);
        }
      }
      indexOffset += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    merged.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3)
    );
    merged.setIndex(indices);
    return merged;
  }

  clear(): void {
    while (this.mapGroup.children.length > 0) {
      const child = this.mapGroup.children[0];
      this.mapGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    this.rendered = false;
  }
}
