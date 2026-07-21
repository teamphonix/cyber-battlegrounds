"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Action = "forward"|"back"|"left"|"right";

function makeFighter(color:number, dark:number){
  const group=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color,roughness:.72});
  const trim=new THREE.MeshStandardMaterial({color:dark,roughness:.55,metalness:.25});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.78,1.05,.46),mat);body.position.y=1.45;body.castShadow=true;group.add(body);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.62,.62,.62),mat);head.position.y=2.28;head.castShadow=true;group.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(.64,.18,.04),new THREE.MeshStandardMaterial({color:0x70eaff,emissive:0x19798c,emissiveIntensity:1.4}));visor.position.set(0,2.32,-.32);group.add(visor);
  [-.25,.25].forEach(x=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.25,.75,.3),trim);leg.position.set(x,.55,0);leg.castShadow=true;group.add(leg)});
  [-.54,.54].forEach(x=>{const arm=new THREE.Mesh(new THREE.BoxGeometry(.23,.85,.28),mat);arm.position.set(x,1.5,0);arm.castShadow=true;group.add(arm)});
  const gun=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.8),trim);gun.position.set(.54,1.45,-.48);group.add(gun);return group;
}

export default function Home(){
  const mount=useRef<HTMLDivElement>(null);const active=useRef(new Set<Action>());const engine=useRef<{fire:()=>void;build:()=>void;remove:()=>void;jump:()=>void}|null>(null);
  const [started,setStarted]=useState(false);const [hud,setHud]=useState({hp:100,enemy:100,blocks:24,score:0});const [help,setHelp]=useState(true);

  useEffect(()=>{if(!mount.current)return;const host=mount.current;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x07111f);scene.fog=new THREE.Fog(0x07111f,22,58);
    const camera=new THREE.PerspectiveCamera(68,host.clientWidth/host.clientHeight,.1,120);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0x85cfff,0x132115,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(-12,24,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
    const ground=new THREE.Mesh(new THREE.BoxGeometry(54,1,54),new THREE.MeshStandardMaterial({color:0x172b31,roughness:.95}));ground.position.y=-.5;ground.receiveShadow=true;scene.add(ground);
    const grid=new THREE.GridHelper(54,54,0x5cfff2,0x244552);grid.position.y=.01;scene.add(grid);
    const blocks:THREE.Mesh[]=[];const blockGeo=new THREE.BoxGeometry(1,1,1);const mats=[0x335e59,0x315178,0x633e72,0x6b573b].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.82}));
    const addBlock=(x:number,y:number,z:number,material=0)=>{if(blocks.some(b=>b.position.distanceTo(new THREE.Vector3(x,y,z))<.2))return;const b=new THREE.Mesh(blockGeo,mats[material%mats.length]);b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;b.userData.block=true;blocks.push(b);scene.add(b)};
    for(let x=-25;x<=25;x++){addBlock(x,.5,-25,1);addBlock(x,.5,25,1)}for(let z=-24;z<25;z++){addBlock(-25,.5,z,1);addBlock(25,.5,z,1)}
    [[-8,0,-6],[8,0,6],[-11,0,10],[10,0,-10],[0,0,0]].forEach(([x,,z],i)=>{for(let yy=0;yy<3;yy++)for(let xx=-2;xx<=2;xx++)addBlock(x+xx,yy+.5,z,i%4)});
    for(let i=0;i<35;i++){const x=Math.floor(Math.random()*39)-19,z=Math.floor(Math.random()*39)-19;if(Math.abs(x)<5&&Math.abs(z)<5)continue;addBlock(x,.5,z,i%4);if(Math.random()>.68)addBlock(x,1.5,z,i%4)}
    const player=makeFighter(0x80ff72,0x173a32);player.position.set(0,0,8);scene.add(player);const bot=makeFighter(0xff5b7f,0x49172a);bot.position.set(0,0,-10);scene.add(bot);
    const shots:{mesh:THREE.Mesh;velocity:THREE.Vector3;owner:string;life:number}[]=[];let hp=100,enemy=100,score=0,inventory=24,vy=0,onGround=true,yaw=0,pitch=.38,drag=false,lastX=0,lastY=0,fireCd=0,botCd=0,running=true;
    const ray=new THREE.Raycaster();const clock=new THREE.Clock();
    const shoot=(who="player")=>{if(who==="player"&&fireCd>0)return;const owner=who==="player"?player:bot;const dir=new THREE.Vector3(0,0,-1).applyQuaternion(owner.quaternion).normalize();const orb=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),new THREE.MeshBasicMaterial({color:who==="player"?0xbaff66:0xff5277}));orb.position.copy(owner.position).add(new THREE.Vector3(0,1.55,0)).addScaledVector(dir,.8);scene.add(orb);shots.push({mesh:orb,velocity:dir.multiplyScalar(18),owner:who,life:2.4});if(who==="player")fireCd=.28;else botCd=.65};
    const build=()=>{if(inventory<=0)return;const dir=new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);const p=player.position.clone().addScaledVector(dir,2.2);const x=Math.round(p.x),z=Math.round(p.z);if(Math.hypot(x-player.position.x,z-player.position.z)<1.2)return;let y=.5;while(blocks.some(b=>b.position.distanceTo(new THREE.Vector3(x,y,z))<.2)&&y<4.5)y++;addBlock(x,y,z,0);inventory--;setHud({hp,enemy,blocks:inventory,score})};
    const remove=()=>{const origin=player.position.clone().add(new THREE.Vector3(0,1.5,0));const dir=new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);ray.set(origin,dir);const hit=ray.intersectObjects(blocks,false)[0];if(hit&&hit.distance<5){const b=hit.object as THREE.Mesh;scene.remove(b);blocks.splice(blocks.indexOf(b),1);inventory=Math.min(30,inventory+1);setHud({hp,enemy,blocks:inventory,score})}};
    const jump=()=>{if(onGround){vy=7.3;onGround=false}};engine.current={fire:()=>shoot(),build,remove,jump};
    const kd=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==="w")active.current.add("forward");if(k==="s")active.current.add("back");if(k==="a")active.current.add("left");if(k==="d")active.current.add("right");if(k===" "){e.preventDefault();jump()}if(k==="f")shoot();if(k==="e")build();if(k==="r")remove()};const ku=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==="w")active.current.delete("forward");if(k==="s")active.current.delete("back");if(k==="a")active.current.delete("left");if(k==="d")active.current.delete("right")};
    const pd=(e:PointerEvent)=>{if(e.target===renderer.domElement){drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)}};const pm=(e:PointerEvent)=>{if(!drag)return;yaw-=(e.clientX-lastX)*.007;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.004,.12,.8);lastX=e.clientX;lastY=e.clientY};const pu=()=>drag=false;
    addEventListener("keydown",kd);addEventListener("keyup",ku);renderer.domElement.addEventListener("pointerdown",pd);renderer.domElement.addEventListener("pointermove",pm);renderer.domElement.addEventListener("pointerup",pu);
    const collides=(p:THREE.Vector3)=>blocks.some(b=>Math.abs(b.position.x-p.x)<.72&&Math.abs(b.position.z-p.z)<.72&&b.position.y<2.2);
    let raf=0;const animate=()=>{raf=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.035);if(running){fireCd-=dt;botCd-=dt;
      player.rotation.y=yaw;const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),move=new THREE.Vector3();if(active.current.has("forward"))move.add(forward);if(active.current.has("back"))move.sub(forward);if(active.current.has("right"))move.add(right);if(active.current.has("left"))move.sub(right);if(move.lengthSq()){move.normalize().multiplyScalar(5.4*dt);const next=player.position.clone().add(move);if(!collides(next)){player.position.copy(next)}player.children.slice(3,5).forEach((leg,i)=>leg.rotation.x=Math.sin(performance.now()*.012+i*Math.PI)*.5)}
      vy-=18*dt;player.position.y+=vy*dt;if(player.position.y<=0){player.position.y=0;vy=0;onGround=true}
      const toPlayer=player.position.clone().sub(bot.position);toPlayer.y=0;const d=toPlayer.length();bot.rotation.y=Math.atan2(-toPlayer.x,-toPlayer.z);if(d>7){const next=bot.position.clone().add(toPlayer.normalize().multiplyScalar(2.4*dt));if(!collides(next))bot.position.copy(next)}if(d<18&&botCd<=0)shoot("bot");
      shots.forEach(s=>{s.mesh.position.addScaledVector(s.velocity,dt);s.life-=dt;const target=s.owner==="player"?bot:player;if(s.mesh.position.distanceTo(target.position.clone().add(new THREE.Vector3(0,1.3,0)))<.65){if(s.owner==="player")enemy-=14;else hp-=10;s.life=0}if(blocks.some(b=>s.mesh.position.distanceTo(b.position)<.62))s.life=0});for(let i=shots.length-1;i>=0;i--)if(shots[i].life<=0){scene.remove(shots[i].mesh);shots.splice(i,1)}
      if(enemy<=0){score++;enemy=100;bot.position.set((Math.random()-.5)*25,0,-14);inventory=Math.min(30,inventory+5)}if(hp<=0){hp=100;score=Math.max(0,score-1);player.position.set(0,0,8)}setHud({hp,enemy,blocks:inventory,score});
    }
      const focus=player.position.clone().add(new THREE.Vector3(0,1.4,0));const camOffset=new THREE.Vector3(Math.sin(yaw)*7*Math.cos(pitch),3+Math.sin(pitch)*4,Math.cos(yaw)*7*Math.cos(pitch));camera.position.lerp(focus.clone().add(camOffset),.13);camera.lookAt(focus);renderer.render(scene,camera)};animate();
    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener("resize",resize);
    return()=>{running=false;cancelAnimationFrame(raf);removeEventListener("resize",resize);removeEventListener("keydown",kd);removeEventListener("keyup",ku);renderer.dispose();host.removeChild(renderer.domElement)}
  },[]);
  const hold=(a:Action,label:string)=><button onPointerDown={()=>active.current.add(a)} onPointerUp={()=>active.current.delete(a)} onPointerLeave={()=>active.current.delete(a)}>{label}</button>;
  return <main className="game-shell"><div ref={mount} className="world"/>
    <header className="game-top"><div className="brand"><span className="brand-mark">CB</span><div><b>CYBER BATTLE</b><small>GROUNDS · VOXEL ALPHA</small></div></div><button className="help" onClick={()=>setHelp(true)}>CONTROLS</button></header>
    <div className="hud"><div><small>HEALTH</small><strong>{hud.hp}</strong><span className="bar"><i style={{width:`${hud.hp}%`}}/></span></div><div><small>RIFT HP</small><strong>{hud.enemy}</strong></div><div><small>BLOCKS</small><strong>{hud.blocks}</strong></div><div><small>SCORE</small><strong>{hud.score}</strong></div></div>
    <div className="crosshair">+</div><div className="mission"><b>VOXEL WILDS</b><span>Hunt RIFT. Build your path. Own the ground.</span></div>
    <div className="mobile"><div className="move"><i/>{hold("forward","▲")}<i/>{hold("left","◀")}{hold("back","▼")}{hold("right","▶")}</div><div className="mobile-actions"><button onClick={()=>engine.current?.jump()}>JUMP</button><button onClick={()=>engine.current?.remove()}>MINE</button><button onClick={()=>engine.current?.build()}>BUILD</button><button className="fire" onClick={()=>engine.current?.fire()}>FIRE</button></div></div>
    {!started&&<div className="splash"><div><p>3D PLAYABLE PROTOTYPE</p><h1>ENTER THE<br/><em>VOXEL WILDS</em></h1><span>Walk the world as a cyber fighter. Build, mine, jump, and battle.</span><button onClick={()=>{setStarted(true);setHelp(false)}}>DROP IN <b>→</b></button></div></div>}
    {help&&started&&<div className="guide"><div><button onClick={()=>setHelp(false)}>×</button><p>FIELD CONTROLS</p><h2>MOVE LIKE A FIGHTER.<br/>BUILD LIKE A CREATOR.</h2><section><span><kbd>WASD</kbd> WALK</span><span><kbd>DRAG</kbd> LOOK</span><span><kbd>SPACE</kbd> JUMP</span><span><kbd>F</kbd> FIRE</span><span><kbd>E</kbd> BUILD</span><span><kbd>R</kbd> MINE</span></section><small>On phones, drag the world to look and use the on-screen controls.</small></div></div>}
  </main>
}
