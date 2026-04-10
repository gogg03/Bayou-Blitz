import * as THREE from 'three';

const HULL_L = 26;
const HULL_W = 14;
const HULL_H = 2;
const RAMP_L = 8;
const FAN_R = 7;

export class BoatRenderer {
  private scene: THREE.Scene;
  private boatMeshes: Map<string, THREE.Group> = new Map();
  private fanGroups: Map<string, THREE.Group> = new Map();
  private headlights: Map<string, THREE.SpotLight> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createBoat(id: string, color: number = 0xb0b0b0, name?: string): THREE.Group {
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

    const headlight = new THREE.SpotLight(0xfff4d6, 120, 400, 0.45, 0.5, 1);
    headlight.position.set(0, HULL_H + 3, -(HULL_L / 2));
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, -2, -(HULL_L / 2 + 150));
    group.add(lightTarget);
    headlight.target = lightTarget;
    headlight.visible = false;
    group.add(headlight);

    if (name) {
      const label = this.createLabel(name);
      label.position.set(0, HULL_H + 16, 0);
      group.add(label);
    }

    this.scene.add(group);
    this.boatMeshes.set(id, group);
    this.fanGroups.set(id, fanGroup);
    this.headlights.set(id, headlight);
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

  removeBoat(id: string): void {
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
