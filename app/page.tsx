"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "deathmatch" | "ctf" | "core";
type Player = { x: number; y: number; angle: number; hp: number; score: number; color: string; name: string; cooldown: number; melee: number; hasFlag: boolean };
type Wall = { x: number; y: number; hp: number; owner: number };
type Shot = { x: number; y: number; vx: number; vy: number; owner: number; life: number };

const MODES: { id: Mode; name: string; desc: string; icon: string }[] = [
  { id: "deathmatch", name: "Knockout", desc: "First to 7 eliminations", icon: "⚡" },
  { id: "ctf", name: "Flag Raid", desc: "Steal the enemy crystal", icon: "◆" },
  { id: "core", name: "Core Breaker", desc: "Destroy the rival core", icon: "◉" },
];

const W = 960, H = 600;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const dist = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x-b.x, a.y-b.y);

function makePlayers(): Player[] { return [
  { x: 150, y: 300, angle: 0, hp: 100, score: 0, color: "#80ff72", name: "NOVA", cooldown: 0, melee: 0, hasFlag: false },
  { x: 810, y: 300, angle: Math.PI, hp: 100, score: 0, color: "#ff5b7f", name: "RIFT", cooldown: 0, melee: 0, hasFlag: false },
]; }

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const touch = useRef(new Set<string>());
  const game = useRef({ players: makePlayers(), walls: [] as Wall[], shots: [] as Shot[], running: false, mode: "deathmatch" as Mode, versus: "bot", winner: "", cores: [300,300], flags: [{x:88,y:300,homeX:88,homeY:300},{x:872,y:300,homeX:872,homeY:300}] });
  const [mode, setMode] = useState<Mode>("deathmatch");
  const [versus, setVersus] = useState<"bot"|"local">("bot");
  const [playing, setPlaying] = useState(false);
  const [hud, setHud] = useState({ hp1:100, hp2:100, s1:0, s2:0, winner:"" });
  const [showHelp, setShowHelp] = useState(false);

  const action = useCallback((player: number, kind: "shoot"|"melee"|"build") => {
    const g=game.current, p=g.players[player]; if(!g.running || p.hp<=0) return;
    if(kind==="shoot" && p.cooldown<=0){ g.shots.push({x:p.x+Math.cos(p.angle)*24,y:p.y+Math.sin(p.angle)*24,vx:Math.cos(p.angle)*8,vy:Math.sin(p.angle)*8,owner:player,life:80}); p.cooldown=18; }
    if(kind==="melee" && p.melee<=0){ p.melee=20; const e=g.players[1-player]; if(dist(p,e)<62){ e.hp-=28; } }
    if(kind==="build" && p.cooldown<=0){ const x=clamp(p.x+Math.cos(p.angle)*55,35,W-35), y=clamp(p.y+Math.sin(p.angle)*55,35,H-35); g.walls.push({x,y,hp:80,owner:player}); if(g.walls.length>18) g.walls.shift(); p.cooldown=22; }
  },[]);

  const startGame = () => { const g=game.current; g.players=makePlayers(); g.walls=[]; g.shots=[]; g.mode=mode; g.versus=versus; g.winner=""; g.running=true; g.cores=[300,300]; g.flags=[{x:88,y:300,homeX:88,homeY:300},{x:872,y:300,homeX:872,homeY:300}]; setHud({hp1:100,hp2:100,s1:0,s2:0,winner:""}); setPlaying(true); };

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{ keys.current.add(e.key.toLowerCase()); if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault(); if(e.key===" ")action(0,"shoot"); if(e.key.toLowerCase()==="q")action(0,"melee"); if(e.key.toLowerCase()==="e")action(0,"build"); if(e.key==="Enter")action(1,"shoot"); if(e.key==="/")action(1,"melee"); if(e.key===".")action(1,"build");};
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase()); addEventListener("keydown",down);addEventListener("keyup",up);return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up)};
  },[action]);

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d")!; let raf=0, last=0;
    const respawn=(i:number)=>{const g=game.current,p=g.players[i],enemy=g.players[1-i]; enemy.score++; p.x=i?810:150;p.y=300;p.hp=100;p.hasFlag=false;if(g.mode==="deathmatch"&&enemy.score>=7){g.winner=enemy.name;g.running=false;}};
    const hitWalls=(x:number,y:number)=>game.current.walls.some(w=>Math.abs(x-w.x)<30&&Math.abs(y-w.y)<30);
    const loop=(t:number)=>{raf=requestAnimationFrame(loop);if(t-last<16)return;last=t;const g=game.current;
      if(g.running){
        g.players.forEach((p,i)=>{p.cooldown=Math.max(0,p.cooldown-1);p.melee=Math.max(0,p.melee-1);let dx=0,dy=0;const k=keys.current,tc=touch.current;
          if(i===0){if(k.has("w")||tc.has("up"))dy--;if(k.has("s")||tc.has("down"))dy++;if(k.has("a")||tc.has("left"))dx--;if(k.has("d")||tc.has("right"))dx++;}
          else if(g.versus==="local"){if(k.has("arrowup"))dy--;if(k.has("arrowdown"))dy++;if(k.has("arrowleft"))dx--;if(k.has("arrowright"))dx++;}
          else {const target=g.players[0], d=dist(p,target); if(d>180){dx=Math.sign(target.x-p.x);dy=Math.sign(target.y-p.y)} else {dy=Math.sin(t/450);dx=-Math.sin(t/650)} if(d<360&&p.cooldown<=0)action(1,"shoot");if(d<58&&p.melee<=0)action(1,"melee");if(Math.random()<.004)action(1,"build");}
          if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;p.angle=Math.atan2(dy,dx);const nx=clamp(p.x+dx*3.3,22,W-22),ny=clamp(p.y+dy*3.3,22,H-22);if(!hitWalls(nx,ny)){p.x=nx;p.y=ny}}
        });
        g.shots.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.life--;const e=g.players[1-s.owner];if(dist(s,e)<20){e.hp-=14;s.life=0;}g.walls.forEach(w=>{if(Math.abs(s.x-w.x)<29&&Math.abs(s.y-w.y)<29){w.hp-=20;s.life=0}})});g.shots=g.shots.filter(s=>s.life>0&&s.x>0&&s.x<W&&s.y>0&&s.y<H);g.walls=g.walls.filter(w=>w.hp>0);
        g.players.forEach((p,i)=>{if(p.hp<=0)respawn(i)});
        if(g.mode==="ctf")g.players.forEach((p,i)=>{const enemyFlag=g.flags[1-i];if(!p.hasFlag&&dist(p,enemyFlag)<35){p.hasFlag=true;enemyFlag.x=p.x;enemyFlag.y=p.y}if(p.hasFlag){enemyFlag.x=p.x;enemyFlag.y=p.y;if((i===0&&p.x<115)||(i===1&&p.x>845)){p.score++;p.hasFlag=false;enemyFlag.x=enemyFlag.homeX;enemyFlag.y=enemyFlag.homeY;if(p.score>=3){g.winner=p.name;g.running=false}}}});
        if(g.mode==="core")g.shots.forEach(s=>{const target=1-s.owner,cx=target?885:75;if(Math.hypot(s.x-cx,s.y-300)<42){g.cores[target]-=3;s.life=0;if(g.cores[target]<=0){g.winner=g.players[s.owner].name;g.running=false}}});
        setHud({hp1:g.players[0].hp,hp2:g.players[1].hp,s1:g.players[0].score,s2:g.players[1].score,winner:g.winner});
      }
      ctx.clearRect(0,0,W,H);const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,"#16233b");grad.addColorStop(1,"#090e1a");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle="rgba(126,249,255,.08)";ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      ctx.fillStyle="rgba(128,255,114,.08)";ctx.fillRect(0,0,120,H);ctx.fillStyle="rgba(255,91,127,.08)";ctx.fillRect(W-120,0,120,H);
      if(g.mode==="ctf")g.flags.forEach((f,i)=>{ctx.fillStyle=i?"#ff5b7f":"#80ff72";ctx.beginPath();ctx.moveTo(f.x,f.y-18);ctx.lineTo(f.x+15,f.y);ctx.lineTo(f.x,f.y+18);ctx.lineTo(f.x-15,f.y);ctx.fill()});
      if(g.mode==="core")g.cores.forEach((hp,i)=>{const x=i?885:75;ctx.strokeStyle=i?"#ff5b7f":"#80ff72";ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,300,34,-Math.PI/2,-Math.PI/2+Math.PI*2*(hp/300));ctx.stroke();ctx.fillStyle="#eef7ff";ctx.font="700 14px monospace";ctx.textAlign="center";ctx.fillText(String(Math.max(0,hp)),x,305)});
      g.walls.forEach(w=>{ctx.fillStyle=w.owner?"#943e59":"#397a48";ctx.fillRect(w.x-28,w.y-28,56,56);ctx.strokeStyle=w.owner?"#ff8aa3":"#9aff8f";ctx.lineWidth=3;ctx.strokeRect(w.x-28,w.y-28,56,56);ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(w.x-22,w.y+18,44*(w.hp/80),4)});
      g.shots.forEach(s=>{ctx.fillStyle=s.owner?"#ff8aa3":"#d9ff72";ctx.shadowBlur=12;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(s.x,s.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0});
      g.players.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.shadowBlur=18;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.fillRect(8,-5,24,10);ctx.shadowBlur=0;if(p.melee>12){ctx.strokeStyle="#fff";ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,38,-.8,.8);ctx.stroke()}ctx.restore();ctx.fillStyle="#0a101c";ctx.fillRect(p.x-24,p.y-34,48,6);ctx.fillStyle=p.color;ctx.fillRect(p.x-24,p.y-34,48*(p.hp/100),6)});
      if(!g.running&&g.winner){ctx.fillStyle="rgba(3,6,13,.75)";ctx.fillRect(0,0,W,H);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 54px Arial";ctx.fillText(`${g.winner} WINS`,W/2,H/2);ctx.font="18px Arial";ctx.fillStyle="#9fb1c7";ctx.fillText("Tap REMATCH to jump back in",W/2,H/2+38)}
    };raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[action]);

  const touchButton=(id:string,label:string,kind?:"shoot"|"melee"|"build")=><button aria-label={label} className={`touch-btn ${kind?"action":""}`} onPointerDown={e=>{e.preventDefault();if(kind)action(0,kind);else touch.current.add(id)}} onPointerUp={()=>touch.current.delete(id)} onPointerLeave={()=>touch.current.delete(id)}>{label}</button>;

  return <main>
    <header><div className="brand"><span className="brand-mark">CB</span><div><b>CYBER BATTLE</b><small>GROUNDS</small></div></div><button className="help" onClick={()=>setShowHelp(!showHelp)}>HOW TO PLAY</button></header>
    <section className="hero"><div><p className="eyebrow">BUILD · BATTLE · BREAK THROUGH</p><h1>YOUR GROUND.<br/><em>YOUR RULES.</em></h1><p className="intro">Drop into a neon arena, build cover in seconds, and outplay your rival. Pick a mode and enter the battle.</p></div>
      <div className="setup"><span className="step">01 / CHOOSE MODE</span><div className="mode-grid">{MODES.map(m=><button key={m.id} className={mode===m.id?"selected":""} onClick={()=>setMode(m.id)}><i>{m.icon}</i><b>{m.name}</b><small>{m.desc}</small></button>)}</div><span className="step">02 / CHOOSE RIVAL</span><div className="toggle"><button className={versus==="bot"?"active":""} onClick={()=>setVersus("bot")}>VS BOT</button><button className={versus==="local"?"active":""} onClick={()=>setVersus("local")}>2 PLAYERS · PC</button></div><button className="deploy" onClick={startGame}>{playing?"REMATCH":"DEPLOY NOW"}<span>→</span></button></div>
    </section>
    <section className={`arena-wrap ${playing?"live":""}`}><div className="arena-head"><div><span className="live-dot"/> LIVE ARENA</div><div className="score"><b style={{color:"#80ff72"}}>NOVA {hud.s1}</b><span>{MODES.find(m=>m.id===mode)?.name.toUpperCase()}</span><b style={{color:"#ff5b7f"}}>{hud.s2} RIFT</b></div></div>
      <canvas ref={canvasRef} width={W} height={H}/><div className="touch-controls"><div className="dpad"><span/>{touchButton("up","▲")}<span/>{touchButton("left","◀")}{touchButton("down","▼")}{touchButton("right","▶")}</div><div className="actions">{touchButton("build","BUILD","build")}{touchButton("melee","HIT","melee")}{touchButton("shoot","FIRE","shoot")}</div></div>
    </section>
    <footer><span>PROTOTYPE 01</span><p>Original browser battle game · Built for keyboard and touch</p><span>NO DOWNLOAD</span></footer>
    {showHelp&&<div className="modal" onClick={()=>setShowHelp(false)}><div onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowHelp(false)}>×</button><p className="eyebrow">FIELD MANUAL</p><h2>OUTBUILD. OUTPLAY.</h2><div className="help-grid"><section><b>PLAYER ONE</b><p><kbd>W A S D</kbd> Move</p><p><kbd>SPACE</kbd> Fire</p><p><kbd>Q</kbd> Melee</p><p><kbd>E</kbd> Build</p></section><section><b>PLAYER TWO</b><p><kbd>ARROWS</kbd> Move</p><p><kbd>ENTER</kbd> Fire</p><p><kbd>/</kbd> Melee</p><p><kbd>.</kbd> Build</p></section></div><p className="tip">On phones, use the on-screen movement pad and action buttons. Landscape works best.</p></div></div>}
  </main>;
}
