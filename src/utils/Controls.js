/**
 * Controls.js — Unified input handler for keyboard (PC) and virtual joystick (mobile).
 * Exposes moveX / moveZ as normalized -1..1 values consumed by the game loop.
 */
export class Controls {
  constructor() {
    this.keys = {};
    this.joystick = { x: 0, y: 0 }; // set by MobileHUD via nipplejs

    // Detect touch device
    this.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    // Callbacks — assigned by Game.js
    this.onAttack        = null;
    this.onSpecial       = null;
    this.onJump          = null;
    this.onInteract      = null;
    this.onCameraToggle  = null;

    this._bindKeyboard();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      switch (e.code) {
        case 'KeyV':    this.onCameraToggle?.(); break;
        case 'Space':   e.preventDefault(); this.onJump?.(); break;
        case 'KeyF':    this.onAttack?.();   break;
        case 'KeyQ':    this.onSpecial?.();  break;
        case 'KeyE':    this.onInteract?.(); break;
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  /** Horizontal movement: -1 (left/A) … +1 (right/D) */
  get moveX() {
    const kb = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0)
             - (this.keys['KeyA'] || this.keys['ArrowLeft']  ? 1 : 0);
    return Math.max(-1, Math.min(1, kb + this.joystick.x));
  }

  /** Forward/back: -1 (forward/W) … +1 (back/S) */
  get moveZ() {
    const kb = (this.keys['KeyS'] || this.keys['ArrowDown']  ? 1 : 0)
             - (this.keys['KeyW'] || this.keys['ArrowUp']    ? 1 : 0);
    return Math.max(-1, Math.min(1, kb + this.joystick.y));
  }

  get isMoving() {
    return Math.abs(this.moveX) > 0.05 || Math.abs(this.moveZ) > 0.05;
  }

  /** Called by MobileHUD with nipplejs vector */
  setJoystick(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
  }
}
