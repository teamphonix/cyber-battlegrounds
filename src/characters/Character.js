/**
 * Character.js — Builds a blocky voxel character from Babylon.js Box meshes.
 * Used for both the local player and remote players.
 * Each character type gets a unique color scheme.
 */

const CHARACTER_CONFIGS = {
  cyber_soldier: { bodyHex: '#1e3a5f', accentHex: '#00e5ff' },
  hacker:        { bodyHex: '#1a3d1a', accentHex: '#39ff14' },
  cyber_ninja:   { bodyHex: '#111111', accentHex: '#ff0040' },
  heavy_gunner:  { bodyHex: '#3a3a3a', accentHex: '#ff6600' },
};

export class Character {
  /**
   * @param {BABYLON.Scene} scene
   * @param {string} type  - 'cyber_soldier' | 'hacker' | 'cyber_ninja' | 'heavy_gunner'
   * @param {string} name  - Player display name
   */
  constructor(scene, type, name) {
    this.scene     = scene;
    this.type      = type;
    this.name      = name;
    this.walkCycle = 0;
    this.root      = null;
    this._pivots   = {};

    const cfg = CHARACTER_CONFIGS[type] || CHARACTER_CONFIGS.cyber_soldier;
    this._build(cfg);
    this._buildNameTag();
  }

  // ─── Build ────────────────────────────────────────────────────

  _build(cfg) {
    const scene = this.scene;
    const uid   = `${this.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Materials
    const bodyMat = new BABYLON.StandardMaterial(`body_${uid}`, scene);
    bodyMat.diffuseColor  = BABYLON.Color3.FromHexString(cfg.bodyHex);
    bodyMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.3);

    const accentMat = new BABYLON.StandardMaterial(`accent_${uid}`, scene);
    accentMat.diffuseColor  = BABYLON.Color3.FromHexString(cfg.accentHex);
    accentMat.emissiveColor = BABYLON.Color3.FromHexString(cfg.accentHex).scale(0.7);

    // Root node — position = world position of character feet
    this.root = new BABYLON.TransformNode(`root_${uid}`, scene);

    const mk = (id, w, h, d, mat) => {
      const box = BABYLON.MeshBuilder.CreateBox(`${id}_${uid}`, { width: w, height: h, depth: d }, scene);
      box.material = mat;
      box.parent   = this.root;
      return box;
    };

    const pivot = (id, x, y, z) => {
      const t = new BABYLON.TransformNode(`${id}_${uid}`, scene);
      t.position.set(x, y, z);
      t.parent = this.root;
      return t;
    };

    // ── Head
    const head = mk('head', 0.8, 0.8, 0.8, bodyMat);
    head.position.y = 2.2;

    // Eyes (neon accent)
    [-0.2, 0.2].forEach((xp, i) => {
      const eye = BABYLON.MeshBuilder.CreateBox(`eye${i}_${uid}`, { width: 0.18, height: 0.12, depth: 0.05 }, scene);
      eye.position.set(xp, 2.25, 0.42);
      eye.material = accentMat;
      eye.parent   = this.root;
    });

    // ── Torso
    const torso = mk('torso', 0.9, 1.1, 0.5, bodyMat);
    torso.position.y = 1.1;

    // Neon chest stripe
    const stripe = mk('stripe', 0.95, 0.1, 0.55, accentMat);
    stripe.position.y = 1.32;

    // ── Arms (pivot at shoulder)
    const lArmPivot = pivot('lArmPivot', -0.625, 1.6, 0);
    const lArm = BABYLON.MeshBuilder.CreateBox(`lArm_${uid}`, { width: 0.35, height: 1.0, depth: 0.35 }, scene);
    lArm.position.y = -0.5; lArm.material = bodyMat; lArm.parent = lArmPivot;

    const rArmPivot = pivot('rArmPivot',  0.625, 1.6, 0);
    const rArm = BABYLON.MeshBuilder.CreateBox(`rArm_${uid}`, { width: 0.35, height: 1.0, depth: 0.35 }, scene);
    rArm.position.y = -0.5; rArm.material = bodyMat; rArm.parent = rArmPivot;

    // ── Legs (pivot at hip — bottom of torso)
    const lLegPivot = pivot('lLegPivot', -0.24, 0.55, 0);
    const lLeg = BABYLON.MeshBuilder.CreateBox(`lLeg_${uid}`, { width: 0.38, height: 1.0, depth: 0.38 }, scene);
    lLeg.position.y = -0.5; lLeg.material = bodyMat; lLeg.parent = lLegPivot;
    // Neon knee accent
    const lKnee = BABYLON.MeshBuilder.CreateBox(`lKnee_${uid}`, { width: 0.42, height: 0.1, depth: 0.42 }, scene);
    lKnee.position.y = -0.18; lKnee.material = accentMat; lKnee.parent = lLegPivot;

    const rLegPivot = pivot('rLegPivot',  0.24, 0.55, 0);
    const rLeg = BABYLON.MeshBuilder.CreateBox(`rLeg_${uid}`, { width: 0.38, height: 1.0, depth: 0.38 }, scene);
    rLeg.position.y = -0.5; rLeg.material = bodyMat; rLeg.parent = rLegPivot;
    const rKnee = BABYLON.MeshBuilder.CreateBox(`rKnee_${uid}`, { width: 0.42, height: 0.1, depth: 0.42 }, scene);
    rKnee.position.y = -0.18; rKnee.material = accentMat; rKnee.parent = rLegPivot;

    this._pivots = { lArmPivot, rArmPivot, lLegPivot, rLegPivot };
  }

  _buildNameTag() {
    const scene = this.scene;
    const uid   = `nametag_${Date.now()}`;

    // Billboard plane above character
    const plane = BABYLON.MeshBuilder.CreatePlane(`plane_${uid}`, { width: 2.2, height: 0.45 }, scene);
    plane.position.y   = 3.0;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.parent        = this.root;

    const mat = new BABYLON.StandardMaterial(`mat_${uid}`, scene);
    mat.disableLighting  = true;
    mat.backFaceCulling  = false;

    const tex = new BABYLON.DynamicTexture(`tex_${uid}`, { width: 256, height: 48 }, scene, false);
    tex.hasAlpha = true;
    const ctx  = tex.getContext();
    ctx.clearRect(0, 0, 256, 48);
    ctx.font      = 'bold 22px Arial';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 8;
    ctx.fillText(this.name.toUpperCase(), 128, 34);
    tex.update();

    mat.diffuseTexture            = tex;
    mat.diffuseTexture.hasAlpha   = true;
    plane.material = mat;
  }

  // ─── Public API ───────────────────────────────────────────────

  setPosition(x, y, z) {
    this.root.position.set(x, y, z);
  }

  setRotationY(rotY) {
    this.root.rotation.y = rotY;
  }

  /**
   * Animate walk cycle each frame.
   * @param {number} deltaTime - seconds since last frame
   * @param {boolean} isMoving
   */
  update(deltaTime, isMoving) {
    const { lArmPivot, rArmPivot, lLegPivot, rLegPivot } = this._pivots;

    if (isMoving) {
      this.walkCycle += deltaTime * 9;
      const swing = Math.sin(this.walkCycle) * 0.55;
      lArmPivot.rotation.x =  swing;
      rArmPivot.rotation.x = -swing;
      lLegPivot.rotation.x = -swing;
      rLegPivot.rotation.x =  swing;
    } else {
      this.walkCycle = 0;
      // Exponential decay back to rest
      const decay = Math.exp(-10 * deltaTime);
      lArmPivot.rotation.x *= decay;
      rArmPivot.rotation.x *= decay;
      lLegPivot.rotation.x *= decay;
      rLegPivot.rotation.x *= decay;
    }
  }

  dispose() {
    this.root.getChildMeshes().forEach((m) => m.dispose());
    this.root.getChildren().forEach((c) => c.dispose());
    this.root.dispose();
  }
}
