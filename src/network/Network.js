/**
 * Network.js — Socket.io client wrapper.
 * Manages connection, player events, and position broadcasting.
 */
export class Network {
  constructor() {
    this.socket   = null;
    this.playerId = null;

    // Callbacks assigned by Game.js
    this.onPlayerJoined  = null;
    this.onPlayerLeft    = null;
    this.onGameState     = null;
    this.onPlayerAttacked = null;
    this.onPlayerCount   = null;
  }

  /**
   * Connect to the Socket.io server and join the game.
   * @param {{ name: string, character: string }} playerConfig
   * @returns {Promise<{ id: string, players: object, spawn: object }>}
   */
  connect(playerConfig) {
    return new Promise((resolve, reject) => {
      // `io` is the global from /socket.io/socket.io.js
      this.socket = io();

      this.socket.on('connect', () => {
        this.socket.emit('join', {
          name:      playerConfig.name,
          character: playerConfig.character,
        });
      });

      this.socket.on('joined', (data) => {
        this.playerId = data.id;
        resolve(data);
      });

      this.socket.on('connect_error', (err) => {
        console.error('[Network] Connection error:', err);
        reject(err);
      });

      this.socket.on('playerJoined',   (p)  => this.onPlayerJoined?.(p));
      this.socket.on('playerLeft',     (id) => this.onPlayerLeft?.(id));
      this.socket.on('gameState',      (ps) => this.onGameState?.(ps));
      this.socket.on('playerAttacked', (d)  => this.onPlayerAttacked?.(d));
      this.socket.on('playerCount',    (n)  => this.onPlayerCount?.(n));

      this.socket.on('disconnect', () => {
        console.warn('[Network] Disconnected from server');
      });
    });
  }

  sendPosition(x, y, z, rotY, isMoving) {
    if (!this.socket?.connected) return;
    this.socket.emit('move', { x, y, z, rotY, isMoving });
  }

  sendAttack(type, direction) {
    if (!this.socket?.connected) return;
    this.socket.emit('attack', { type, direction });
  }
}
