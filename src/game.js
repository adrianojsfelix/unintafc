// UFS Fighter — Gaby com os sprites desenhados pela equipe (assets/sprites/gaby/atlas.png).
// Canvas 384x224, laço fixo de 60 Hz, animações por quadro, golpes especiais com projétil.
(() => {
  "use strict";

  const W = 384, H = 224, FLOOR = 204;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // ---------- Animações ----------
  // Cada quadro: [id no atlas, duração em ticks (1/60 s), marca opcional]
  //   marca "hit"   = quadro ativo do golpe (caixa de ataque calculada pelo desenho)
  //   marca "spawn" = solta o projétil
  // flip: o desenho original olha para a esquerda e precisa ser espelhado.
  const seq = (row, from, to, t, extra = {}) => {
    const out = [];
    for (let i = from; i <= to; i++) out.push([`r${String(row).padStart(2, "0")}_f${String(i).padStart(2, "0")}`, t, extra[i]]);
    return out;
  };
  const ANIMS = {
    idle:    { loop: true, frames: seq(0, 0, 10, 5) },
    walk:    { loop: true, frames: seq(1, 0, 7, 5) },
    back:    { loop: true, frames: seq(0, 0, 10, 6).reverse() },
    jump:    { frames: [["r06_f01", 5], ["r06_f02", 7], ["r06_f03", 7], ["r06_f04", 7], ["r06_f05", 7], ["r06_f06", 30]] },
    guard:   { loop: true, frames: [["r06_f00", 60]] },
    punch:   { flip: true, frames: [["r07_f05", 3], ["r07_f03", 6, "hit"], ["r07_f04", 7], ["r07_f05", 5]] },
    fire:    { flip: true, frames: [["r07_f06", 4], ["r07_f05", 4], ["r07_f00", 4, "spawn"], ["r07_f01", 5], ["r07_f02", 5], ["r07_f03", 6], ["r07_f04", 8]] },
    cat:     { frames: [...seq(8, 3, 8, 4), ["r08_f09", 6, "spawn"], ["r08_f10", 6], ["r08_f11", 8]] },
    hit:     { frames: [["r09_f00", 7], ["r09_f01", 12]] },
    fall:    { frames: [...seq(9, 2, 8, 6), ...seq(10, 0, 7, 5), ["r10_f08", 999]] },
    burn:    { frames: [...seq(11, 0, 7, 4), ...seq(12, 0, 3, 4), ...seq(13, 0, 7, 4), ...seq(14, 0, 7, 5), ["r14_f07", 999]] },
    win:     { frames: [["r08_f00", 8], ["r08_f01", 8], ["r08_f02", 999]] },
    // projéteis e efeitos
    fireball:{ flip: true, loop: true, frames: seq(6, 7, 10, 4) },
    catrun:  { loop: true, frames: [["r05_f00", 5], ["r05_f02", 5], ["r05_f03", 5], ["r05_f05", 5], ["r05_f06", 5]] },
    boom:    { frames: seq(3, 0, 9, 3) },
  };

  const GABY = {
    walkSpeed: 2.0, backSpeed: 1.4, jumpV: -6.4, gravity: 0.32,
    moves: {
      punch: { anim: "punch", damage: 7, hitstun: 18, blockstun: 12, push: 3.2, chip: 1 },
      fire:  { anim: "fire", proj: { anim: "fireball", speed: 3.4, damage: 12, y: -62, burn: true } },
      cat:   { anim: "cat", proj: { anim: "catrun", speed: 2.4, damage: 10, y: 0 } },
    },
  };

  // ---------- Atlas ----------
  let ATLAS = null;        // {name: [x, y, w, h, ancoraX, base]}
  const sheets = {};       // p1, p2 (paleta alternativa), white (piscar ao apanhar)
  const solid = {};        // máscara de opacidade por quadro (para caixas de ataque)

  const loadImage = src => new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("falha ao carregar " + src)); i.src = src;
  });

  function recolor(img, fn) {
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      if (!d.data[i + 3]) continue;
      const [r, gg, b] = fn(d.data[i], d.data[i + 1], d.data[i + 2]);
      d.data[i] = r; d.data[i + 1] = gg; d.data[i + 2] = b;
    }
    g.putImageData(d, 0, 0);
    return { canvas: c, data: d };
  }
  // P2: roupa preta vira azul-marinho (troca de paleta, como no SNES)
  const altPalette = (r, g, b) => {
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    if (lum < 95 && Math.max(r, g, b) - Math.min(r, g, b) < 34) return [r * 0.55, g * 0.75, Math.min(255, b * 1.9 + 25)];
    return [r, g, b];
  };

  async function loadAssets() {
    ATLAS = await (await fetch("assets/sprites/gaby/atlas.json")).json();
    const img = await loadImage("assets/sprites/gaby/atlas.png");
    const base = recolor(img, (r, g, b) => [r, g, b]);
    sheets.p1 = base.canvas;
    sheets.p2 = recolor(img, altPalette).canvas;
    sheets.white = recolor(img, () => [255, 255, 255]).canvas;
    const d = base.data;
    for (const [name, [x, y, w, h]] of Object.entries(ATLAS)) {
      const m = new Uint8Array(w * h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) m[j * w + i] = d.data[((y + j) * d.width + x + i) * 4 + 3] > 0;
      solid[name] = m;
    }
  }

  // Caixa de ataque a partir do desenho: pega a ponta mais avançada do sprite
  // (punho/bastão) na metade de cima do corpo.
  const hitCache = {};
  function attackBox(name, flip) {
    const key = name + flip;
    if (hitCache[key]) return hitCache[key];
    const [, , w, h, ax] = ATLAS[name], m = solid[name];
    let best = null;
    for (let j = Math.floor(h * 0.15); j < h * 0.7; j++) for (let i = 0; i < w; i++) {
      if (!m[j * w + i]) continue;
      const fx = flip ? (w - 1 - i) - (w - ax) : i - ax;   // distância à frente do eixo, já virada p/ direita
      if (!best || fx > best.fx) best = { fx, y: j - h };
    }
    return (hitCache[key] = { x: best.fx - 18, y: best.y - 9, w: 20, h: 18 });
  }

  // ---------- Entrada ----------
  const keys = new Set(), pressed = new Set();
  addEventListener("keydown", e => {
    Sound.unlock();                       // o navegador só libera áudio após uma tecla
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
    if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  });
  addEventListener("keyup", e => keys.delete(e.code));
  document.querySelectorAll("#touch button").forEach(b => {
    const k = b.dataset.k;
    b.addEventListener("pointerdown", e => { e.preventDefault(); Sound.unlock(); if (!keys.has(k)) pressed.add(k); keys.add(k); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, () => keys.delete(k)));
  });
  const MAP = {
    p1: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", punch: "KeyJ", fire: "KeyK", cat: "KeyL" },
    p2: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", punch: "Enter", fire: "Period", cat: "Slash" },
  };
  const readHuman = m => ({
    left: keys.has(m.left), right: keys.has(m.right), up: keys.has(m.up), down: keys.has(m.down),
    punch: pressed.has(m.punch), fire: pressed.has(m.fire), cat: pressed.has(m.cat),
  });
  const NONE = { left: false, right: false, up: false, down: false, punch: false, fire: false, cat: false };

  // ---------- Objetos animados ----------
  class Anim {
    constructor(name) { this.set(name); }
    set(name) { this.name = name; this.def = ANIMS[name]; this.i = 0; this.t = 0; this.done = false; this.fired = new Set(); }
    get frame() { return this.def.frames[this.i]; }
    tick() {
      if (++this.t < this.frame[1]) return;
      this.t = 0;
      if (this.i + 1 < this.def.frames.length) this.i++;
      else if (this.def.loop) this.i = 0;
      else this.done = true;
    }
  }

  function drawFrame(g, sheet, name, x, y, facing, flipDef) {
    const [sx, sy, w, h, ax] = ATLAS[name];
    const mirror = (facing < 0) !== !!flipDef;
    const anchor = flipDef ? w - ax : ax;     // eixo depois de virar o desenho para a direita
    g.save();
    if (!mirror) g.drawImage(sheet, sx, sy, w, h, Math.round(x - (flipDef ? w - anchor : anchor)), Math.round(y - h), w, h);
    else {
      g.translate(Math.round(x + (flipDef ? w - anchor : anchor)), Math.round(y - h));
      g.scale(-1, 1);
      g.drawImage(sheet, sx, sy, w, h, 0, 0, w, h);
    }
    g.restore();
  }

  class Projectile {
    constructor(owner, spec) {
      this.owner = owner; this.spec = spec; this.facing = owner.facing;
      this.x = owner.x + owner.facing * 30; this.y = FLOOR + spec.y;
      this.anim = new Anim(spec.anim); this.dead = false; this.life = 0;
    }
    box() {
      const [, , w, h] = ATLAS[this.anim.frame[0]];
      return { x: this.x - w * 0.3, y: this.y - h * 0.8, w: w * 0.6, h: h * 0.6 };
    }
    update() {
      this.anim.tick(); this.life++;
      this.x += this.spec.speed * this.facing;
      if (this.x < -80 || this.x > W + 80) this.dead = true;
    }
    draw(g) { drawFrame(g, sheets.p1, this.anim.frame[0], this.x, this.y, this.facing, this.anim.def.flip); }
  }

  class Effect {
    constructor(name, x, y) { this.anim = new Anim(name); this.x = x; this.y = y; }
    update() { this.anim.tick(); }
    get dead() { return this.anim.done; }
    draw(g) { drawFrame(g, sheets.p1, this.anim.frame[0], this.x, this.y, 1, false); }
  }

  // ---------- Lutador ----------
  class Fighter {
    constructor(def, pal, x, facing, label) {
      this.def = def; this.pal = pal; this.label = label; this.voice = pal === "p2" ? 0.86 : 1; this.spawnX = x; this.spawnFacing = facing;
      this.reset();
    }
    reset() {
      Object.assign(this, { x: this.spawnX, y: FLOOR, vx: 0, vy: 0, facing: this.spawnFacing, hp: 100, shownHp: 100,
        state: "idle", stun: 0, flash: 0, hasHit: false, blocking: false, crouch: false, move: null, cooldown: 0 });
      this.anim = new Anim("idle");
    }
    play(name) { if (this.anim.name !== name) this.anim.set(name); }
    get airborne() { return this.y < FLOOR; }
    get busy() { return ["attack", "hit", "ko", "win"].includes(this.state); }

    hurtbox() {
      const low = this.crouch || this.state === "block";
      const h = this.state === "ko" ? 30 : low ? 70 : 104;
      return { x: this.x - 17, y: this.y - h, w: 34, h };
    }
    hitbox() {
      if (this.state !== "attack" || this.hasHit || this.anim.frame[2] !== "hit") return null;
      const b = attackBox(this.anim.frame[0], this.anim.def.flip);
      const x = this.facing > 0 ? this.x + b.x : this.x - b.x - b.w;
      return { x, y: this.y + b.y, w: b.w, h: b.h };
    }

    startMove(name) {
      this.state = "attack"; this.move = this.def.moves[name]; this.hasHit = false; this.crouch = false;
      this.anim.set(this.move.anim);
      if (name === "punch") Sound.play("whoosh");
    }

    update(input, foe, world) {
      if (this.flash) this.flash--;
      if (this.cooldown) this.cooldown--;
      if (!this.airborne && !this.busy) this.facing = foe.x >= this.x ? 1 : -1;
      const back = this.facing > 0 ? input.left : input.right;
      const fwd = this.facing > 0 ? input.right : input.left;

      if (this.state === "hit") {
        this.vx *= 0.82;
        if (--this.stun <= 0) { this.state = "idle"; this.blocking = false; }
      } else if (this.state === "ko" || this.state === "win") {
        this.vx *= 0.9;
      } else if (this.state === "attack") {
        if (!this.airborne) this.vx = 0;
        const f = this.anim.frame;
        if (f[2] === "spawn" && !this.anim.fired.has(this.anim.i) && this.move.proj) {
          this.anim.fired.add(this.anim.i);
          world.projectiles.push(new Projectile(this, this.move.proj));
          Sound.play(this.move.proj.anim === "catrun" ? "meow" : "fire");
          this.cooldown = 70;
        }
        if (this.anim.done) { this.state = "idle"; this.move = null; }
      } else if (!this.airborne) {
        this.crouch = input.down; this.blocking = back; this.vx = 0;
        const projOut = world.projectiles.some(p => p.owner === this);
        if (input.fire && !projOut && !this.cooldown) this.startMove("fire");
        else if (input.cat && !projOut && !this.cooldown) this.startMove("cat");
        else if (input.punch) this.startMove("punch");
        else if (input.up) {
          this.vy = this.def.jumpV; this.vx = fwd ? 2.2 * this.facing : back ? -2.2 * this.facing : 0;
          this.state = "jump"; this.crouch = false; this.anim.set("jump");
        }
        else if (this.crouch) this.state = back ? "block" : "crouch";
        else if (fwd) { this.vx = this.def.walkSpeed * this.facing; this.state = "walk"; }
        else if (back) { this.vx = -this.def.backSpeed * this.facing; this.state = "back"; }
        else this.state = "idle";
      }

      this.x += this.vx;
      if (this.airborne || this.vy < 0) {
        this.vy += this.def.gravity; this.y += this.vy;
        if (this.y >= FLOOR) {
          this.y = FLOOR; this.vy = 0;
          if (this.state === "jump") this.state = "idle";
        }
      }
      this.x = Math.max(24, Math.min(W - 24, this.x));
      this.shownHp += (this.hp - this.shownHp) * 0.08;

      // escolhe a animação pelo estado
      const byState = { idle: "idle", walk: "walk", back: "back", crouch: "guard", block: "guard", jump: "jump" };
      if (byState[this.state]) this.play(this.state === "idle" && this.blocking ? "guard" : byState[this.state]);
      this.anim.tick();
    }

    takeHit(spec, dir) {
      const canBlock = this.blocking && !this.airborne && ["idle", "back", "block", "crouch", "hit"].includes(this.state);
      if (canBlock) {
        this.hp = Math.max(1, this.hp - (spec.chip ?? 2));
        this.state = "hit"; this.stun = spec.blockstun ?? 14; this.vx = dir * 2.4; this.play("guard");
        Sound.play("block");
        return "block";
      }
      this.hp = Math.max(0, this.hp - spec.damage);
      this.blocking = false; this.crouch = false; this.flash = 4; this.move = null;
      if (this.hp === 0) {
        this.state = "ko"; this.vx = dir * 2.2;
        this.anim.set(spec.burn ? "burn" : "fall");
        Sound.play("hit"); Sound.play("ko", this.voice);
      } else {
        this.state = "hit"; this.stun = spec.hitstun ?? 20; this.vx = dir * (spec.push ?? 3); this.anim.set("hit");
        Sound.play("hit"); Sound.play("pain", this.voice);
      }
      return "hit";
    }

    draw(g, debug) {
      const sheet = this.flash ? sheets.white : sheets[this.pal];
      g.fillStyle = "rgba(0,0,0,0.35)";
      const sw = 24 - Math.min(10, (FLOOR - this.y) / 6);
      g.beginPath(); g.ellipse(Math.round(this.x), FLOOR + 1, sw, 3.5, 0, 0, Math.PI * 2); g.fill();
      const shake = this.state === "hit" && this.stun > 8 ? ((this.stun & 2) ? 1 : -1) : 0;
      drawFrame(g, sheet, this.anim.frame[0], this.x + shake, this.y, this.facing, this.anim.def.flip);
      if (debug) {
        const hb = this.hurtbox(); g.strokeStyle = "#3cf"; g.strokeRect(hb.x + 0.5, hb.y + 0.5, hb.w, hb.h);
        const ab = this.hitbox(); if (ab) { g.strokeStyle = "#f33"; g.strokeRect(ab.x + 0.5, ab.y + 0.5, ab.w, ab.h); }
      }
    }
  }

  // ---------- CPU ----------
  const cpu = { mode: "ai", timer: 0, hold: {} };
  function cpuInput(me, foe, world) {
    const dist = Math.abs(foe.x - me.x);
    const toward = foe.x > me.x ? "right" : "left", away = toward === "right" ? "left" : "right";
    const out = { ...NONE };
    if (cpu.mode === "dummy") { out[away] = foe.state === "attack" || world.projectiles.some(p => p.owner === foe); return out; }
    const threat = (foe.state === "attack" && dist < 110) || world.projectiles.some(p => p.owner === foe && Math.abs(p.x - me.x) < 90);
    if (threat && Math.random() < 0.55) { out[away] = true; return out; }
    if (--cpu.timer <= 0) {
      cpu.timer = 12 + (Math.random() * 26 | 0);
      const r = Math.random();
      cpu.hold = dist > 150 ? (r < 0.25 ? { fire: true } : r < 0.35 ? { cat: true } : { [toward]: true })
        : dist > 75 ? (r < 0.6 ? { [toward]: true } : r < 0.75 ? { up: true, [toward]: true } : r < 0.85 ? { fire: true } : {})
        : r < 0.4 ? { punch: true } : r < 0.6 ? { [away]: true } : r < 0.7 ? { down: true } : {};
    }
    Object.assign(out, cpu.hold);
    if (cpu.hold.punch || cpu.hold.fire || cpu.hold.cat) cpu.hold = {};
    if (cpu.hold.up) cpu.hold = { [toward]: true };
    return out;
  }

  // ---------- Partida ----------
  let fighters, debug = false, p2Human = false;
  const world = { projectiles: [], effects: [] };
  const match = { time: 99, frame: 0, banner: "", bannerT: 0, over: false, hitstop: 0 };
  const timers = [];

  function resetRound() {
    timers.splice(0).forEach(clearTimeout);
    fighters.forEach(f => f.reset());
    world.projectiles = []; world.effects = [];
    Object.assign(match, { time: 99, frame: 0, over: false, hitstop: 0 });
    showBanner("FIGHT!", 70);
    Sound.play("fight");
  }
  function showBanner(t, d) { match.banner = t; match.bannerT = d; }
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function step() {
    if (pressed.has("KeyH")) debug = !debug;
    if (pressed.has("KeyM")) showBanner(Sound.toggleMute() ? "SOM OFF" : "SOM ON", 50);
    if (pressed.has("KeyR")) resetRound();
    if (pressed.has("Digit1")) { cpu.mode = cpu.mode === "ai" ? "dummy" : "ai"; p2Human = false; showBanner(cpu.mode === "ai" ? "CPU" : "TREINO", 50); }
    if (Object.values(MAP.p2).some(k => pressed.has(k))) p2Human = true;
    if (match.hitstop > 0) { match.hitstop--; pressed.clear(); return; }

    const [a, b] = fighters, live = !match.over;
    a.update(live ? readHuman(MAP.p1) : NONE, b, world);
    b.update(live ? (p2Human ? readHuman(MAP.p2) : cpuInput(b, a, world)) : NONE, a, world);

    const dx = b.x - a.x, minD = 40;
    if (Math.abs(dx) < minD && Math.abs(a.y - b.y) < 70 && a.state !== "ko" && b.state !== "ko") {
      const push = (minD - Math.abs(dx)) / 2 * Math.sign(dx || 1); a.x -= push; b.x += push;
    }

    for (const [att, def] of [[a, b], [b, a]]) {
      const hb = att.hitbox();
      if (hb && def.state !== "ko" && overlap(hb, def.hurtbox())) {
        att.hasHit = true;
        const res = def.takeHit(att.move, att.facing);
        match.hitstop = res === "hit" ? 7 : 4;
        world.effects.push(new Effect("boom", hb.x + hb.w / 2 + att.facing * 4, hb.y + hb.h + 30));
      }
    }
    for (const p of world.projectiles) {
      p.update();
      const foe = p.owner === a ? b : a;
      if (!p.dead && foe.state !== "ko" && overlap(p.box(), foe.hurtbox())) {
        p.dead = true;
        const res = foe.takeHit({ ...p.spec, hitstun: 26, push: 3.5 }, p.facing);
        match.hitstop = res === "hit" ? 8 : 4;
        world.effects.push(new Effect("boom", p.x, p.y + 10));
        Sound.play("boom");
      }
    }
    // projéteis que se cruzam se anulam
    const [p1, p2] = [world.projectiles.find(p => p.owner === a), world.projectiles.find(p => p.owner === b)];
    if (p1 && p2 && overlap(p1.box(), p2.box())) { p1.dead = p2.dead = true; world.effects.push(new Effect("boom", (p1.x + p2.x) / 2, p1.y)); Sound.play("boom"); }
    world.projectiles = world.projectiles.filter(p => !p.dead);
    world.effects.forEach(e => e.update());
    world.effects = world.effects.filter(e => !e.dead);
    if (match.bannerT > 0) match.bannerT--;

    if (!match.over) {
      if (++match.frame % 60 === 0 && match.time > 0) match.time--;
      if (a.hp === 0 || b.hp === 0 || match.time === 0) {
        match.over = true;
        const winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
        showBanner(a.hp === 0 || b.hp === 0 ? "K.O." : "TIME", 120);
        timers.push(setTimeout(() => {
          if (winner) { winner.state = "win"; winner.anim.set("win"); Sound.play("win"); }
          showBanner(winner ? winner.label + " VENCE" : "EMPATE", 160);
        }, 1600));
        timers.push(setTimeout(resetRound, 5200));
      }
    }
    pressed.clear();
  }

  // ---------- Desenho ----------
  function drawStage(g) {
    // cenário provisório — os cenários definitivos são a próxima etapa
    const sky = g.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, "#1a1440"); sky.addColorStop(0.6, "#5b2a5e"); sky.addColorStop(1, "#c0566a");
    g.fillStyle = sky; g.fillRect(0, 0, W, FLOOR);
    g.fillStyle = "#2a1d3a";
    for (let i = 0; i < 12; i++) { const bx = i * 34 - 6, bh = 40 + ((i * 37) % 50); g.fillRect(bx, FLOOR - 40 - bh, 30, bh + 40); }
    g.fillStyle = "#f2c96b";
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) if ((i * 7 + j * 3) % 5 < 2) g.fillRect(i * 34 + j * 6, FLOOR - 70 + j * 9 - (i % 3) * 8, 3, 4);
    g.fillStyle = "#3d3350"; g.fillRect(0, FLOOR, W, H - FLOOR);
    g.fillStyle = "#4b405f"; for (let x = 0; x < W; x += 32) g.fillRect(x, FLOOR, 16, H - FLOOR);
    g.fillStyle = "#6a5c80"; g.fillRect(0, FLOOR, W, 1);
  }
  function text(g, s, x, y, size, color, align = "left") {
    g.font = `bold ${size}px ui-monospace, Menlo, Consolas, monospace`;
    g.textAlign = align; g.textBaseline = "top";
    g.fillStyle = "#000"; g.fillText(s, x + 1, y + 1);
    g.fillStyle = color; g.fillText(s, x, y);
  }
  function drawHud(g) {
    const [a, b] = fighters;
    const bar = (f, x, dir) => {
      const w = 150, h = 9, y = 12;
      g.fillStyle = "#000"; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = "#7a0d16"; g.fillRect(x, y, w, h);
      const lag = w * f.shownHp / 100, cur = w * f.hp / 100;
      g.fillStyle = "#e9e4f5"; dir > 0 ? g.fillRect(x + w - lag, y, lag, h) : g.fillRect(x, y, lag, h);
      g.fillStyle = f.hp > 30 ? "#f3d23a" : "#ff6a2a"; dir > 0 ? g.fillRect(x + w - cur, y, cur, h) : g.fillRect(x, y, cur, h);
    };
    bar(a, 12, 1); bar(b, W - 162, -1);
    text(g, a.label, 12, 24, 9, "#fff");
    text(g, b.label + (p2Human ? "" : cpu.mode === "ai" ? " (CPU)" : " (TREINO)"), W - 12, 24, 9, "#fff", "right");
    text(g, String(match.time).padStart(2, "0"), W / 2, 8, 16, "#f3d23a", "center");
    if (match.bannerT > 0) text(g, match.banner, W / 2, 70, 28, "#ffe066", "center");
    if (!Sound.ready) text(g, "aperte qualquer tecla para ligar o som", W / 2, H - 12, 8, "#ffe9a8", "center");
    if (debug) text(g, `P1 ${a.state}/${a.anim.frame[0]}  P2 ${b.state}/${b.anim.frame[0]}`, 6, H - 12, 8, "#9fe");
  }
  function render() {
    drawStage(ctx);
    const order = [...fighters].sort((p, q) => (p.state === "attack") - (q.state === "attack"));
    order.forEach(f => f.draw(ctx, debug));
    world.projectiles.forEach(p => p.draw(ctx));
    world.effects.forEach(e => e.draw(ctx));
    drawHud(ctx);
  }

  let last = 0, acc = 0;
  function loop(ts) {
    acc += Math.min(100, ts - (last || ts)); last = ts;
    while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
    render();
    requestAnimationFrame(loop);
  }

  loadAssets().then(() => {
    fighters = [new Fighter(GABY, "p1", 120, 1, "GABY"), new Fighter(GABY, "p2", 264, -1, "GABY")];
    resetRound();
    requestAnimationFrame(loop);
  }).catch(err => {
    ctx.fillStyle = "#fff"; ctx.font = "10px monospace";
    ctx.fillText(err.message + " (abra via servidor http)", 8, 20);
  });
})();
