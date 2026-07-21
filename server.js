const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve all static files from project root
app.use(express.static(path.join(__dirname)));

// ─── Game State ───────────────────────────────────────────────
const players = {};
const TICK_RATE = 20; // broadcasts per second

// Spawn points spread around the central plaza
const SPAWN_POINTS = [
  { x:  4, y: 0.5, z:  4 },
  { x: -4, y: 0.5, z:  4 },
  { x:  4, y: 0.5, z: -4 },
  { x: -4, y: 0.5, z: -4 },
];

const CHARACTER_HEALTH = {
  cyber_soldier: 120,
  hacker:         80,
  cyber_ninja:    90,
  heavy_gunner:  180,
};

function getSpawn() {
  const idx = Object.keys(players).length % SPAWN_POINTS.length;
  return { ...SPAWN_POINTS[idx] };
}

// ─── Socket.io Events ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected  ${socket.id}`);

  socket.on('join', (data) => {
    const spawn = getSpawn();
    const maxHP  = CHARACTER_HEALTH[data.character] || 100;
    players[socket.id] = {
      id:        socket.id,
      name:      (data.name || 'Runner').slice(0, 16),
      character: data.character || 'cyber_soldier',
      x: spawn.x, y: spawn.y, z: spawn.z,
      rotY:      0,
      health:    maxHP,
      maxHealth: maxHP,
      isMoving:  false,
    };

    // Tell this client their ID + everyone else
    socket.emit('joined', { id: socket.id, players, spawn });
    // Tell everyone else about the newcomer
    socket.broadcast.emit('playerJoined', players[socket.id]);

    console.log(`[→] ${players[socket.id].name} joined as ${data.character}`);
    io.emit('playerCount', Object.keys(players).length);
  });

  socket.on('move', (data) => {
    if (!players[socket.id]) return;
    Object.assign(players[socket.id], {
      x: data.x, y: data.y, z: data.z,
      rotY: data.rotY,
      isMoving: data.isMoving,
    });
  });

  socket.on('attack', (data) => {
    if (!players[socket.id]) return;
    socket.broadcast.emit('playerAttacked', { id: socket.id, ...data });
  });

  socket.on('disconnect', () => {
    const name = players[socket.id]?.name || socket.id;
    console.log(`[-] Disconnected  ${name}`);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    io.emit('playerCount', Object.keys(players).length);
  });
});

// ─── Game State Broadcast ─────────────────────────────────────
setInterval(() => {
  if (Object.keys(players).length > 0) {
    io.emit('gameState', players);
  }
}, 1000 / TICK_RATE);

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   ⚡  CYBER BATTLEGROUNDS SERVER  ⚡  ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Local:   http://localhost:${PORT}        ║`);
  console.log(`║  Network: http://<your-ip>:${PORT}        ║`);
  console.log('║  Port 3001 (Codex runs on 3000)      ║');
  console.log('╚══════════════════════════════════════╝\n');
});
