/**
 * World.js — Builds the cyberpunk 3D city environment.
 * - Dark reflective ground with neon grid lines
 * - Procedural buildings with neon accent strips
 * - Street lamps and point lights
 * - GlowLayer for neon bloom effect
 * - Atmospheric fog
 */
export class World {
  constructor(scene) {
    this.scene     = scene;
    this.glowLayer = null;
  }

  build() {
    this._setupFog();
    this._setupLighting();
    this._setupGlow();
    this._buildGround();
    this._buildBuildings();
    this._buildStreetDetails();
  }

  // ─── Environment Setup ────────────────────────────────────────

  _setupFog() {
    this.scene.fogMode    = BABYLON.Scene.FOGMODE_EXP2;
    this.scene.fogColor   = new BABYLON.Color3(0.02, 0.02, 0.07);
    this.scene.fogDensity = 0.014;
  }

  _setupLighting() {
    const scene = this.scene;

    // Dim ambient — dark blue-purple sky
    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity   = 0.28;
    ambient.diffuse     = new BABYLON.Color3(0.12, 0.12, 0.32);
    ambient.groundColor = new BABYLON.Color3(0.04, 0.0, 0.07);

    // Neon point lights scattered around the plaza
    const lights = [
      { pos: [ 9, 4,  9], c: [0,    1,    1   ] },  // cyan
      { pos: [-9, 4,  9], c: [0.75, 0,    1   ] },  // purple
      { pos: [ 9, 4, -9], c: [1,    0.1,  0.5 ] },  // pink
      { pos: [-9, 4, -9], c: [0,    0.8,  1   ] },  // teal
      { pos: [ 0, 8,  0], c: [0.4,  0,    1   ] },  // violet overhead
    ];
    lights.forEach(({ pos, c }, i) => {
      const l = new BABYLON.PointLight(`neon${i}`, new BABYLON.Vector3(...pos), scene);
      l.diffuse   = new BABYLON.Color3(...c);
      l.intensity = 70;
      l.range     = 28;
    });
  }

  _setupGlow() {
    this.glowLayer           = new BABYLON.GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.85;
  }

  // ─── Ground ───────────────────────────────────────────────────

  _buildGround() {
    const scene = this.scene;

    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 90, height: 90 }, scene);
    const mat    = new BABYLON.StandardMaterial('groundMat', scene);
    mat.diffuseColor  = new BABYLON.Color3(0.03, 0.03, 0.07);
    mat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.45);
    mat.specularPower = 80;
    ground.material   = mat;

    // Neon grid overlay
    this._buildGrid(90, 5);
  }

  _buildGrid(size, cellSize) {
    const scene = this.scene;
    const half  = size / 2;
    const count = size / cellSize;
    const lines = [];

    for (let i = 0; i <= count; i++) {
      const pos = -half + i * cellSize;
      lines.push([new BABYLON.Vector3(pos,  0.01, -half), new BABYLON.Vector3(pos,  0.01,  half)]);
      lines.push([new BABYLON.Vector3(-half, 0.01,  pos), new BABYLON.Vector3(half,  0.01,  pos)]);
    }

    const grid  = BABYLON.MeshBuilder.CreateLineSystem('grid', { lines }, scene);
    grid.color  = new BABYLON.Color3(0, 0.25, 0.45);
    grid.alpha  = 0.6;
  }

  // ─── Buildings ───────────────────────────────────────────────

  _buildBuildings() {
    const neons = [
      new BABYLON.Color3(0, 0.9, 1),       // cyan
      new BABYLON.Color3(0.75, 0, 1),      // purple
      new BABYLON.Color3(1, 0.08, 0.45),   // pink
      new BABYLON.Color3(0, 1, 0.45),      // green
      new BABYLON.Color3(1, 0.45, 0),      // orange
    ];

    // [x, z, width, height, depth]
    const layout = [
      // North wall
      [-18, -24,  10, 28, 6],
      [  0, -27,  14, 38, 8],
      [ 18, -24,  10, 22, 6],
      // South wall
      [-18,  24,  10, 25, 6],
      [  0,  27,  14, 32, 8],
      [ 18,  24,  10, 20, 6],
      // East wall
      [ 25, -10,   6, 34, 10],
      [ 25,   6,   6, 20,  8],
      // West wall
      [-25, -10,   6, 30, 10],
      [-25,   6,   6, 26,  8],
      // Corner towers
      [ 23, -23,   8, 42, 8],
      [-23, -23,   8, 38, 8],
      [ 23,  23,   8, 36, 8],
      [-23,  23,   8, 34, 8],
    ];

    layout.forEach(([x, z, w, h, d], i) => {
      this._createBuilding(x, z, w, h, d, neons[i % neons.length]);
    });
  }

  _createBuilding(x, z, w, h, d, neon) {
    const scene = this.scene;
    const uid   = `b_${x}_${z}`;

    // Building body
    const box = BABYLON.MeshBuilder.CreateBox(uid, { width: w, height: h, depth: d }, scene);
    box.position.set(x, h / 2, z);
    box.checkCollisions = true;

    const mat = new BABYLON.StandardMaterial(`${uid}_mat`, scene);
    mat.diffuseColor  = new BABYLON.Color3(0.04, 0.04, 0.09);
    mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.15);
    box.material = mat;

    // Neon horizontal strips at 30%, 60%, 88% height
    [0.30, 0.60, 0.88].forEach((f, si) => {
      const strip = BABYLON.MeshBuilder.CreateBox(`${uid}_s${si}`, {
        width: w + 0.15, height: h * 0.04, depth: d + 0.15,
      }, scene);
      strip.position.set(x, h * f, z);
      const sm = new BABYLON.StandardMaterial(`${uid}_sm${si}`, scene);
      sm.diffuseColor  = neon;
      sm.emissiveColor = neon.scale(0.65);
      strip.material   = sm;
    });

    // Roof light
    const roofLight = new BABYLON.PointLight(`${uid}_rl`, new BABYLON.Vector3(x, h + 1, z), scene);
    roofLight.diffuse   = neon;
    roofLight.intensity = 35;
    roofLight.range     = 18;
  }

  // ─── Street Details ───────────────────────────────────────────

  _buildStreetDetails() {
    const scene = this.scene;

    // Central plaza glowing disc
    const disc = BABYLON.MeshBuilder.CreateDisc('plaza', { radius: 9, tessellation: 40 }, scene);
    disc.rotation.x  = Math.PI / 2;
    disc.position.y  = 0.015;
    const dm = new BABYLON.StandardMaterial('plazaMat', scene);
    dm.emissiveColor = new BABYLON.Color3(0, 0.18, 0.38);
    dm.diffuseColor  = new BABYLON.Color3(0.02, 0.05, 0.12);
    disc.material    = dm;

    // Street lamps
    const lampPos = [
      [ 12, 0,  0], [-12, 0,  0], [ 0, 0,  12], [ 0, 0, -12],
      [ 11, 0,  11], [-11, 0,  11], [ 11, 0, -11], [-11, 0, -11],
    ];
    lampPos.forEach(([lx, , lz], i) => {
      // Post
      const post = BABYLON.MeshBuilder.CreateCylinder(`lamp_post_${i}`, {
        height: 5.5, diameterTop: 0.08, diameterBottom: 0.14, tessellation: 6,
      }, scene);
      post.position.set(lx, 2.75, lz);
      const pm = new BABYLON.StandardMaterial(`pm_${i}`, scene);
      pm.diffuseColor = new BABYLON.Color3(0.18, 0.18, 0.25);
      post.material   = pm;

      // Lamp orb
      const orb = BABYLON.MeshBuilder.CreateSphere(`lamp_orb_${i}`, { diameter: 0.35, segments: 6 }, scene);
      orb.position.set(lx, 5.65, lz);
      const om = new BABYLON.StandardMaterial(`om_${i}`, scene);
      om.emissiveColor = new BABYLON.Color3(0, 0.85, 1);
      orb.material = om;

      // Point light at lamp
      const pl = new BABYLON.PointLight(`lamp_light_${i}`, new BABYLON.Vector3(lx, 5.5, lz), scene);
      pl.diffuse   = new BABYLON.Color3(0, 0.85, 1);
      pl.intensity = 22;
      pl.range     = 14;
    });
  }
}
