/**
 * MobileHUD.js — Virtual joystick + action buttons for touch devices.
 * Uses nipplejs for the left-thumb joystick.
 * Right-thumb area handles camera rotation natively via the Babylon camera.
 */
export class MobileHUD {
  constructor(controls) {
    this.controls = controls;
    this._joystick = null;

    if (controls.isMobile) {
      document.getElementById('mobile-hud')?.classList.remove('hidden');
      document.getElementById('pc-controls-hint')?.classList.add('hidden');
      this._setupJoystick();
      this._setupButtons();
    }
  }

  _setupJoystick() {
    const zone = document.getElementById('joystick-zone');
    if (!zone || typeof nipplejs === 'undefined') return;

    this._joystick = nipplejs.create({
      zone,
      mode:     'static',
      position: { left: '50%', top: '50%' },
      color:    '#00e5ff',
      size:     110,
    });

    this._joystick.on('move', (_evt, data) => {
      if (data?.vector) {
        // nipplejs y: +1 = up → we want moveZ = -1 for "forward", so negate Y
        this.controls.setJoystick(data.vector.x, -data.vector.y);
      }
    });

    this._joystick.on('end', () => this.controls.setJoystick(0, 0));
  }

  _setupButtons() {
    const bind = (id, cb) => {
      const btn = document.getElementById(id);
      if (!btn || !cb) return;
      // touchstart for zero-latency; prevent ghost click
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); cb(); }, { passive: false });
      btn.addEventListener('click', cb); // fallback for PC testing
    };

    bind('btn-attack',   () => this.controls.onAttack?.());
    bind('btn-special',  () => this.controls.onSpecial?.());
    bind('btn-jump',     () => this.controls.onJump?.());
    bind('btn-interact', () => this.controls.onInteract?.());
    bind('btn-cam',      () => this.controls.onCameraToggle?.());
  }

  destroy() {
    this._joystick?.destroy();
  }
}
