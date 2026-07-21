/**
 * Camera.js — Dual camera system for Cyber Battlegrounds.
 * Mode 1: Third-person ArcRotateCamera (default)
 * Mode 2: Isometric orthographic ArcRotateCamera
 * Toggle with V key (or CAM button on mobile).
 */
export class CameraManager {
  constructor(scene, canvas) {
    this.scene   = scene;
    this.canvas  = canvas;
    this.mode    = 'thirdperson';
    this.target  = null; // TransformNode to follow

    this._createCameras();
  }

  _createCameras() {
    const { scene, canvas } = this;

    // ── Third-person camera ──────────────────────────────────
    this.tpCam = new BABYLON.ArcRotateCamera(
      'tpCam',
      -Math.PI / 2,   // alpha  — behind player (south)
       Math.PI / 4,   // beta   — 45° above horizontal
       18,            // radius — distance from player
      BABYLON.Vector3.Zero(),
      scene
    );
    this.tpCam.lowerRadiusLimit   = 5;
    this.tpCam.upperRadiusLimit   = 40;
    this.tpCam.lowerBetaLimit     = 0.15;
    this.tpCam.upperBetaLimit     = Math.PI / 2.1;
    this.tpCam.angularSensibilityX = 600;
    this.tpCam.angularSensibilityY = 600;
    this.tpCam.wheelPrecision      = 5;
    this.tpCam.pinchPrecision      = 50; // mobile pinch zoom
    this.tpCam.attachControl(canvas, true);

    // ── Isometric camera ─────────────────────────────────────
    this.isoCam = new BABYLON.ArcRotateCamera(
      'isoCam',
      -Math.PI / 4,   // 45° horizontal
       Math.PI / 4,   // ~45° vertical
       50,
      BABYLON.Vector3.Zero(),
      scene
    );
    this.isoCam.mode       = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    this.isoCam.orthoLeft  = -22;
    this.isoCam.orthoRight =  22;
    this.isoCam.orthoTop   =  16;
    this.isoCam.orthoBottom = -16;

    // Start in third-person
    scene.activeCamera = this.tpCam;
  }

  /** Set the TransformNode the camera follows */
  follow(node) {
    this.target = node;
  }

  /** Toggle between third-person and isometric */
  toggle() {
    if (this.mode === 'thirdperson') {
      this.mode = 'isometric';
      this.isoCam.target = this.tpCam.target.clone();
      this.scene.activeCamera = this.isoCam;
      this.tpCam.detachControl();
      this.isoCam.attachControl(this.canvas, true);
    } else {
      this.mode = 'thirdperson';
      this.tpCam.target = this.isoCam.target.clone();
      this.scene.activeCamera = this.tpCam;
      this.isoCam.detachControl();
      this.tpCam.attachControl(this.canvas, true);
    }

    // Update HUD label
    const el = document.getElementById('cam-mode');
    if (el) el.textContent = this.mode === 'thirdperson' ? '3RD PERSON' : 'ISOMETRIC';
  }

  /** Smooth-follow target, called each frame */
  update() {
    if (!this.target) return;
    const tp = this.target.position;
    const dest = new BABYLON.Vector3(tp.x, tp.y + 1.2, tp.z);
    const cam  = this.mode === 'thirdperson' ? this.tpCam : this.isoCam;
    BABYLON.Vector3.LerpToRef(cam.target, dest, 0.12, cam.target);
  }

  /**
   * Horizontal "forward" vector based on current camera orientation.
   * Used to translate W/S input into world-space movement.
   */
  getForwardDirection() {
    const cam = this.mode === 'thirdperson' ? this.tpCam : this.isoCam;
    const raw  = cam.target.subtract(cam.position);
    return new BABYLON.Vector3(raw.x, 0, raw.z).normalize();
  }

  /**
   * Horizontal "right" vector — 90° CW from forward when viewed from above.
   */
  getRightDirection() {
    const fwd = this.getForwardDirection();
    return new BABYLON.Vector3(-fwd.z, 0, fwd.x);
  }
}
