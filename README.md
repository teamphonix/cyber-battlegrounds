# Cyber Battle Grounds

A fast browser-based cyberpunk battle game where players shoot, melee, build cover, and compete across neon arenas.

## Playable prototype

The first prototype includes:

- Knockout, Flag Raid, and Core Breaker modes
- Shooting, melee combat, health, eliminations, and respawning
- Placeable and destructible walls
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

Player one uses **WASD** to move, **Space** to fire, **Q** for melee, and **E** to build. Player two uses the **arrow keys**, **Enter** to fire, **/** for melee, and **.** to build. Phones use the on-screen controls and work best in landscape.

## Roadmap

- [x] Game concept and character art
- [x] Core combat and building loop
- [x] Three game modes
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
