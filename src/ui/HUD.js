/**
 * HUD.js — In-game Heads-Up Display.
 * Manages health bar, player info, player count, and camera mode indicator.
 */
export class HUD {
  constructor() {
    this._el          = document.getElementById('hud');
    this._healthFill  = document.getElementById('health-fill');
    this._healthText  = document.getElementById('health-text');
    this._nameEl      = document.getElementById('player-name-display');
    this._classEl     = document.getElementById('character-class');
    this._countEl     = document.getElementById('player-count');
    this._maxHealth   = 100;
  }

  static CLASS_LABELS = {
    cyber_soldier: 'ASSAULT',
    hacker:        'SUPPORT',
    cyber_ninja:   'STEALTH',
    heavy_gunner:  'TANK',
  };

  static HEALTH_COLORS = {
    cyber_soldier: 'linear-gradient(90deg,#00e5ff,#00ff88)',
    hacker:        'linear-gradient(90deg,#39ff14,#00ffaa)',
    cyber_ninja:   'linear-gradient(90deg,#ff0040,#ff6600)',
    heavy_gunner:  'linear-gradient(90deg,#ff6600,#ffcc00)',
  };

  show() {
    this._el?.classList.remove('hidden');
  }

  setPlayerInfo(name, character, maxHealth) {
    this._maxHealth = maxHealth;
    if (this._nameEl)  this._nameEl.textContent  = name.toUpperCase();
    if (this._classEl) this._classEl.textContent = HUD.CLASS_LABELS[character] || '???';

    // Tint health bar to character colour
    if (this._healthFill) {
      this._healthFill.style.background = HUD.HEALTH_COLORS[character]
        || 'linear-gradient(90deg,#00e5ff,#00ff88)';
    }
  }

  updateHealth(current, max) {
    this._maxHealth = max || this._maxHealth;
    const pct = Math.max(0, Math.min(100, (current / this._maxHealth) * 100));
    if (this._healthFill) this._healthFill.style.width = `${pct}%`;
    if (this._healthText) this._healthText.textContent = `${Math.floor(current)}/${this._maxHealth}`;
  }

  updatePlayerCount(n) {
    if (this._countEl) this._countEl.textContent = `👥 ${n} online`;
  }
}
