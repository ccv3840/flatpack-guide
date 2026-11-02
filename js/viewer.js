// 3D assembly viewer: builds a product from its data file and animates each step.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { HARDWARE } from './catalog.js';

const MATERIALS = {
  board: 0xf3efe6,
  oak: 0xe2c79a,
  back: 0xd6c6aa,
  dark: 0x4a4440,
};
const ACTIVE_PART = 0xffc43d;
const ACTIVE_FIX = 0xff6a1a;
const METAL = 0xa7aeb6;
const WOOD = 0xd9b47a;

const POSES = {
  upright: [0, 0, 0],
  upsideDown: [Math.PI, 0, 0],
  onSide: [0, 0, Math.PI / 2],      // +x side faces up, left side lies on the floor
  faceDown: [Math.PI / 2, 0, 0],    // front faces the floor, back faces up
  onBack: [-Math.PI / 2, 0, 0],     // back on the floor, front faces up
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

export class Viewer {
  constructor(container, { onPick } = {}) {
    this.container = container;
    this.onPick = onPick;
    this.tweens = [];

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 6000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.enablePan = true;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b0a2, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(180, 360, 240);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 10, far: 1200 });
    this.scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.ShadowMaterial({ opacity: 0.14 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const grid = new THREE.GridHelper(600, 60, 0xd8d2c8, 0xe9e4dc);
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    this.scene.add(grid);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.setupPicking();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setupPicking() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, this.camera);
      const targets = [];
      this.root.traverse((o) => { if (o.isMesh && o.visible && o.userData.label) targets.push(o); });
      const hit = ray.intersectObjects(targets, false)[0];
      if (hit && this.onPick) this.onPick(hit.object.userData.label);
    });
  }

  // ---------- building ----------

  load(product) {
    this.product = product;
    this.tweens = [];
    this.root.clear();
    this.parts = new Map();
    this.fixings = [];
    this.introducedAt = new Map();
    this.poseAt = [];

    for (const spec of product.parts) {
      const geo = new THREE.BoxGeometry(...spec.size);
      const mat = new THREE.MeshStandardMaterial({ color: MATERIALS[spec.mat || 'board'], roughness: 0.82, metalness: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { label: spec.label, baseColor: MATERIALS[spec.mat || 'board'] };
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x2a2622, transparent: true, opacity: 0.55 })
      );
      mesh.add(edges);
      mesh.position.set(...spec.pos);
      mesh.visible = false;
      this.root.add(mesh);
      this.parts.set(spec.id, { mesh, spec });
    }

    const scale = product.fastenerScale || 1;
    let pose = 'upright';
    product.steps.forEach((step, i) => {
      pose = step.pose || pose;
      this.poseAt[i] = pose;
      for (const a of step.add || []) this.introducedAt.set(a.id, i);
      this.fixings[i] = (step.fix || []).map((f) => this.makeFixing(f, scale));
    });

    this.poseCache = {};
    this.current = -1;
  }

  makeFixing(f, scale) {
    const hw = HARDWARE[f.t];
    const group = new THREE.Group();
    const color = hw.kind === 'dowel' ? WOOD : METAL;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: hw.kind === 'dowel' ? 0 : 0.6 });
    const L = hw.length * scale;
    const R = hw.radius * scale;
    const add = (geo, y = 0, m = mat) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.y = y;
      mesh.castShadow = true;
      mesh.userData = { label: hw.label, baseColor: m.color.getHex() };
      group.add(mesh);
      return mesh;
    };
    switch (hw.kind) {
      case 'cam': {
        add(new THREE.CylinderGeometry(R, R, L, 24));
        const slot = add(new THREE.BoxGeometry(R * 1.5, 0.08 * scale, R * 0.25), -L / 2 - 0.03 * scale,
          new THREE.MeshBasicMaterial({ color: 0x222222 }));
        slot.userData.fixed = true;
        break;
      }
      case 'cambolt':
        add(new THREE.CylinderGeometry(R, R, L, 12));
        add(new THREE.CylinderGeometry(R * 1.9, R * 1.9, R * 1.4, 16), -L / 2);
        break;
      case 'nail':
        add(new THREE.CylinderGeometry(R, R * 0.6, L, 8));
        add(new THREE.CylinderGeometry(R * 3, R * 3, R * 1.2, 12), -L / 2);
        break;
      case 'pin':
        add(new THREE.CylinderGeometry(R, R, L, 10));
        add(new THREE.BoxGeometry(R * 2.4, L * 0.5, R * 3), -L * 0.55);
        break;
      case 'bracket':
        add(new THREE.BoxGeometry(R * 2, L, R * 1.4));
        break;
      default:
        add(new THREE.CylinderGeometry(R, R, L, hw.kind === 'dowel' ? 14 : 10));
        if (f.t === 'screw') add(new THREE.CylinderGeometry(R * 2.4, R * 2.4, R, 14), -L / 2);
    }
    const dir = new THREE.Vector3(...f.dir).normalize();
    group.quaternion.setFromUnitVectors(Y_AXIS, dir);
    const at = new THREE.Vector3(...f.at);
    group.position.copy(at);
    group.visible = false;
    group.userData = { at, dir, hw, travel: L * 2.2 + 4 * scale };
    this.root.add(group);
    return group;
  }

  poseTransform(name) {
    if (this.poseCache[name]) return this.poseCache[name];
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...POSES[name]));
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    for (const { spec } of this.parts.values()) {
      const [w, h, d] = spec.size;
      for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) {
        v.set(spec.pos[0] + sx * w, spec.pos[1] + sy * h, spec.pos[2] + sz * d).applyQuaternion(q);
        box.expandByPoint(v);
      }
    }
    const center = box.getCenter(new THREE.Vector3());
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z);
    const size = box.getSize(new THREE.Vector3());
    const result = { q, offset, size, center: new THREE.Vector3(0, size.y / 2, 0) };
    this.poseCache[name] = result;
    return result;
  }

  // ---------- steps ----------

  show(index, { animate = true } = {}) {
    const steps = this.product.steps;
    index = Math.max(0, Math.min(steps.length - 1, index));
    this.tweens = [];
    this.current = index;
    const step = steps[index];

    // Parts: visible once introduced, highlighted in the step that adds them.
    for (const [id, { mesh, spec }] of this.parts) {
      const at = this.introducedAt.get(id);
      mesh.visible = at !== undefined && at <= index;
      mesh.position.set(...spec.pos);
      mesh.rotation.set(0, 0, 0);
      mesh.material.color.setHex(at === index ? ACTIVE_PART : mesh.userData.baseColor);
    }
    // Fixings: earlier steps stay in place; current step glows.
    this.fixings.forEach((list, i) => {
      for (const g of list) {
        g.visible = i <= index;
        g.position.copy(g.userData.at);
        g.quaternion.setFromUnitVectors(Y_AXIS, g.userData.dir);
        g.children.forEach((c) => {
          if (!c.userData.fixed) c.material.color.setHex(i === index ? ACTIVE_FIX : c.userData.baseColor);
          if (c.material.emissive) c.material.emissive.setHex(i === index ? 0x5a1a00 : 0x000000);
        });
      }
    });

    // Pose: start from the previous step's pose and turn into this one.
    const from = this.poseTransform(this.poseAt[Math.max(0, index - 1)]);
    const to = this.poseTransform(this.poseAt[index]);
    const poseChanges = animate && this.poseAt[Math.max(0, index - 1)] !== this.poseAt[index];
    if (poseChanges) {
      this.root.quaternion.copy(from.q);
      this.root.position.copy(from.offset);
      const q0 = from.q.clone();
      const p0 = from.offset.clone();
      this.tween(1300, 0, (k) => {
        this.root.quaternion.slerpQuaternions(q0, to.q, k);
        this.root.position.lerpVectors(p0, to.offset, k);
        // Lift slightly mid-turn so corners don't clip the floor.
        this.root.position.y += Math.sin(k * Math.PI) * Math.max(to.size.x, to.size.y, to.size.z) * 0.35;
      });
    } else {
      this.root.quaternion.copy(to.q);
      this.root.position.copy(to.offset);
    }

    this.frame(step, to, animate);
    if (!animate) return;

    const delay0 = poseChanges ? 1300 : 150;
    let stagger = 0;
    for (const a of step.add || []) {
      const { mesh, spec } = this.parts.get(a.id);
      const fromOff = new THREE.Vector3(...(a.from || [0, 30, 0]));
      const final = new THREE.Vector3(...spec.pos);
      const turns = a.spin || 0;
      mesh.position.copy(final).add(fromOff);
      this.tween(1100, delay0 + stagger, (k) => {
        mesh.position.copy(final).addScaledVector(fromOff, 1 - k);
        if (turns) mesh.rotation.y = (1 - k) * turns * Math.PI * 2;
      });
      stagger += 260;
    }
    const fixDelay = delay0 + stagger;
    const list = this.fixings[index];
    const each = Math.max(40, Math.min(160, 1600 / Math.max(1, list.length)));
    list.forEach((g, n) => {
      const { at, dir, hw, travel } = g.userData;
      const baseQ = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir);
      const spin = new THREE.Quaternion();
      g.position.copy(at).addScaledVector(dir, -travel);
      const isCam = hw.kind === 'cam';
      this.tween(isCam ? 1400 : 900, fixDelay + n * each, (k) => {
        const slide = isCam ? Math.min(1, k * 2) : k;
        g.position.copy(at).addScaledVector(dir, -travel * (1 - slide));
        const turns = isCam ? Math.max(0, k * 2 - 1) * hw.spins : (1 - k) * hw.spins;
        spin.setFromAxisAngle(Y_AXIS, turns * Math.PI * 2);
        g.quaternion.copy(baseQ).multiply(spin);
      });
    });
  }

  frame(step, pose, animate) {
    const view = { ...(this.product.view || {}), ...(step.view || {}) };
    const az = THREE.MathUtils.degToRad(view.az ?? 35);
    const el = THREE.MathUtils.degToRad(view.el ?? 28);
    let target;
    let radius;
    if (step.focus) {
      target = new THREE.Vector3(...step.focus.at).applyQuaternion(pose.q).add(pose.offset);
      radius = step.focus.r;
    } else {
      target = pose.center.clone();
      radius = pose.size.length() / 2;
    }
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const dist = (radius / Math.sin(Math.min(vfov, hfov) / 2)) * (view.zoom ?? 0.95);
    const dest = new THREE.Vector3(
      target.x + dist * Math.cos(el) * Math.sin(az),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(el) * Math.cos(az)
    );
    if (!animate || !this.hasFramed) {
      this.camera.position.copy(dest);
      this.controls.target.copy(target);
      this.hasFramed = true;
      return;
    }
    const p0 = this.camera.position.clone();
    const t0 = this.controls.target.clone();
    this.tween(900, 0, (k) => {
      this.camera.position.lerpVectors(p0, dest, k);
      this.controls.target.lerpVectors(t0, target, k);
    });
  }

  tween(duration, delay, update) {
    this.tweens.push({ start: performance.now() + delay, duration, update });
    update(0);
  }

  tick() {
    const now = performance.now();
    this.tweens = this.tweens.filter((t) => {
      const k = Math.min(1, Math.max(0, (now - t.start) / t.duration));
      if (now >= t.start) t.update(ease(k));
      return k < 1;
    });
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
