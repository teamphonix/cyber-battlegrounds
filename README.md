# Cyber Battle Grounds

A 3D browser-based cyberpunk voxel game where players walk as blocky characters, shoot, build, mine, and compete across neon worlds.

## Playable prototype

The first prototype includes:

- A walkable 3D voxel world and third-person character camera
- Shooting, health, eliminations, jumping, and respawning
- Placeable and removable voxel blocks
- Solo play against a bot
- Two-player keyboard play on one PC
- Responsive phone controls

## Characters

| Character | Class | Playstyle |
|---|---|---|
| Cyber Soldier | Assault | Balanced front-liner |
| Hacker | Support / Intel | Tactical disruptor |
| Cyber Ninja | Stealth | Hit-and-run assassin |
| Heavy Gunner | Tank | Suppression and defense |

Character and logo artwork lives in `assets/`. New Antigravity exports should be added under `assets/characters`, `assets/maps`, or `assets/ui`.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local URL printed in the terminal.

## Controls

Use the **arrow keys** to walk, drag the world to look, **Space** to jump, **F** to fire, **E** to build, and **R** to mine a targeted block. Phones use the on-screen controls and work best in landscape.

## Roadmap

- [x] Game concept and character art
- [x] 3D character movement and voxel world
- [x] Core combat, building, and mining loop
- [x] Keyboard and touch controls
- [ ] Character selection and unique abilities
- [ ] Antigravity map integration
- [ ] Cross-device online rooms
- [ ] Sound, progression, and polish

## Stack

- React and TypeScript
- Canvas API game loop
- vinext / Vite
- Cloudflare-compatible deployment

This project is being built collaboratively with AI coding assistants. The GitHub repository is the source of truth.
