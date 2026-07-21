/**
 * Game.js — Main game orchestrator for Cyber Battlegrounds.
 *
 * Flow:
 *  1. index.html collects name + character selection
 *  2. Calls game.start(config)
 *  3. Game builds scene, world, camera, local player
 *  4. Connects to Socket.io server
 *  5. Starts render + game loop
 */

import { World }         from './World.js';
import { CameraManager } from './Camera.js';
import { Character }     from '../characters/Character.js';
import { Network }       from '../network/Network.js';
import { HUD }           from '../ui/HUD.js';
import { MobileHUD }     from '../ui/MobileHUD.js';
import { Controls }      from '../utils/Controls.js';

// Per-character movement speed (units/sec)
const CHAR_SPEED = {
  cyber_soldier: 6,
  hacker:        5,
  cyber_ninja:   9,
  heavy_gunner:  4,
};

// Per-character max HP (mirrors server)
const CHAR_HP = {
  cyber_soldier: 120,
  hacker:         80,
  cyber_ninja:    90,
  heavy_gunner:  180,
};

export class Game {
  constructor() {
    this.canvas        = document.getElementById('renderCanvas');
    this.engine        = null;
    this.scene         = null;
    this.controls      = null;
    this.cameraManager = null;
    this.world         = null;
    this.localChar     = null;   // Character (local player)
    this.localHealth   = 100;
    this.remotes       = {};     // { [socketId]: Character }
    this.network       = null;
    this.hud           = null;
    this.mobileHUD     = null;
    this.playerCfg     = null;
    this._lastSend     = 0;
  }

  // ─── Public entry point ───────────────────────────────────────

  async start(cfg) {
    this.playerCfg   = cfg;
    this.localHealth = CHAR_HP[cfg.character] || 100;

    // ── Babylon Engine + Scene
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.06, 1);

    // ── World
    this.world = new World(this.scene);
    this.world.build();

    // ── Controls + Camera
    this.controls      = new Controls();
    this.cameraManager = new CameraManager(this.scene, this.canvas);

    // ── Local player
    this.localChar = new Character(this.scene, cfg.character, cfg.name);
    this.localChar.setPosition(0, 0.5, 0); // temp until server assigns spawn
    this.cameraManager.follow(this.localChar.root);

    // ── Wire control callbacks
    this.controls.onCameraToggle = () => this.cameraManager.toggle();
    this.controls.onAttack       = () => this._attack();
    this.controls.onJump         = () => this._jump();
    this.controls.onSpecial      = () => this._special();
    this.controls.onInteract     = () => this._interact();

    // ── HUD
    this.hud = new HUD();
    this.hud.show();
    this.hud.setPlayerInfo(cfg.name, cfg.character, this.localHealth);
    this.hud.updateHealth(this.localHealth, this.localHealth);

    // ── Mobile HUD (auto-shows on touch devices)
    this.mobileHUD = new MobileHUD(this.controls);

    // ── Network — connect & join
    this.network = new Network();
    this.network.onPlayerJoined   = (p)  => this._onPlayerJoined(p);
    this.network.onPlayerLeft     = (id) => this._onPlayerLeft(id);
    this.network.onGameState      = (ps) => this._onGameState(ps);
    this.network.onPlayerAttacked = (d)  => this._onPlayerAttacked(d);
    this.network.onPlayerCount    = (n)  => this.hud.updatePlayerCount(n);

    let joinData;
    try {
      joinData = await this.network.connect(cfg);
    } catch (err) {
      console.error('[Game] Could not connect to server:', err);
      return;
    }

    // Apply server-assigned spawn
    if (joinData.spawn) {
      this.localChar.setPosition(joinData.spawn.x, joinData.spawn.y, joinData.spawn.z);
    }

    // Populate existing players
    const playerCount = Object.keys(joinData.players || {}).length;
    this.hud.updatePlayerCount(playerCount);

    Object.values(joinData.players || {}).forEach((p) => {
      if (p.id !== this.network.playerId) this._createRemote(p);
    });

    // ── Game + Render loop
    this.scene.registerBeforeRender(() => this._update());
    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener('resize', () => this.engine.resize());
  }

  // ─── Per-frame update ─────────────────────────────────────────

  _update() {
    const dt = this.engine.getDeltaTime() / 1000; // seconds
    this._moveLocalPlayer(dt);
    this.cameraManager.update();

    // Send position to server ~20×/sec
    const now = performance.now();
    if (now - this._lastSend > 50) {
      const p = this.localChar.root.position;
      this.network.sendPosition(p.x, p.y, p.z, this.localChar.root.rotation.y, this.controls.isMoving);
      this._lastSend = now;
    }
  }

  _moveLocalPlayer(dt) {
    const mx = this.controls.moveX;
    const mz = this.controls.moveZ;
    const moving = Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05;

    if (moving) {
      const fwd   = this.cameraManager.getForwardDirection();
      const right = this.cameraManager.getRightDirection();
      // W/S → forward direction; A/D → right direction
      const dir   = fwd.scale(-mz).add(right.scale(mx));

      if (dir.length() > 0.001) {
        dir.normalize();
        const speed = CHAR_SPEED[this.playerCfg.character] || 6;
        this.localChar.root.position.addInPlace(dir.scale(speed * dt));
        // Lock Y to ground level
        this.localChar.root.position.y = 0.5;
        // Smoothly face direction of travel
        const targetRot = Math.atan2(dir.x, dir.z);
        this.localChar.root.rotation.y = BABYLON.Scalar.Lerp(
          this.localChar.root.rotation.y, targetRot, 0.18
        );
      }
    }

    this.localChar.update(dt, moving);
  }

  // ─── Combat stubs (Phase 3) ───────────────────────────────────

  _attack() {
    const dir = this.cameraManager.getForwardDirection();
    this.network.sendAttack('primary', { x: dir.x, y: dir.y, z: dir.z });
    // TODO: play attack animation
  }

  _special()  { /* TODO Phase 3 */ }
  _jump()     { /* TODO Phase 3 */ }
  _interact() { /* TODO Phase 4 */ }

  // ─── Remote player management ─────────────────────────────────

  _createRemote(data) {
    const char = new Character(this.scene, data.character, data.name);
    char.setPosition(data.x ?? 0, data.y ?? 0.5, data.z ?? 0);
    char.setRotationY(data.rotY ?? 0);
    this.remotes[data.id] = { char, dt: 0 };
  }

  _onPlayerJoined(data) {
    if (data.id === this.network.playerId) return;
    if (!this.remotes[data.id]) this._createRemote(data);
    this.hud.updatePlayerCount(Object.keys(this.remotes).length + 1);
  }

  _onPlayerLeft(id) {
    if (this.remotes[id]) {
      this.remotes[id].char.dispose();
      delete this.remotes[id];
      this.hud.updatePlayerCount(Object.keys(this.remotes).length + 1);
    }
  }

  _onGameState(players) {
    const dt = this.engine?.getDeltaTime() / 1000 || 0.016;

    Object.entries(players).forEach(([id, data]) => {
      if (id === this.network.playerId) return;

      if (!this.remotes[id]) {
        this._createRemote(data);
        return;
      }

      const rc  = this.remotes[id].char;
      const pos = rc.root.position;

      // Interpolate toward server position
      pos.x = BABYLON.Scalar.Lerp(pos.x, data.x, 0.25);
      pos.y = BABYLON.Scalar.Lerp(pos.y, data.y ?? 0.5, 0.25);
      pos.z = BABYLON.Scalar.Lerp(pos.z, data.z, 0.25);
      rc.root.rotation.y = data.rotY ?? rc.root.rotation.y;
      rc.char?.update?.(dt, data.isMoving);
      rc.update?.(dt, data.isMoving); // handle both naming paths
    });
  }

  _onPlayerAttacked(data) {
    // TODO Phase 3 — show hit effect on targeted player
    console.log(`[Game] Player ${data.id} attacked`);
  }
}
