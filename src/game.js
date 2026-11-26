// UFS Fighter — motor de luta 2D (canvas 384x224, laço fixo de 60 Hz).
// Personagens e golpes ficam em src/characters.js; som em src/audio.js.
(() => {
  "use strict";

  const W = 384, H = 224, FLOOR = 204;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // ---------- Carregamento dos atlas ----------
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
  // cor alternativa (luta espelhada): roupa preta vira azul-marinho, como troca de paleta no SNES
  const altPalette = (r, g, b) => {
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    if (lum < 95 && Math.max(r, g, b) - Math.min(r, g, b) < 34) return [r * 0.55, g * 0.75, Math.min(255, b * 1.9 + 25)];
    return [r, g, b];
  };

  async function loadChar(id) {
    const ch = CHARS[id];
    ch.id = id;
    ch.atlas = await (await fetch(`assets/sprites/${id}/atlas.json`)).json();
    const img = await loadImage(`assets/sprites/${id}/atlas.png`);
    const base = recolor(img, (r, g, b) => [r, g, b]);
    ch.sheets = { p1: base.canvas, p2: recolor(img, altPalette).canvas, white: recolor(img, () => [255, 255, 255]).canvas };
    ch.solid = {};
    const d = base.data;
    for (const [name, [x, y, w, h]] of Object.entries(ch.atlas)) {
      const m = new Uint8Array(w * h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) m[j * w + i] = d.data[((y + j) * d.width + x + i) * 4 + 3] > 0;
      ch.solid[name] = m;
    }
    // quadros citados que não existem no atlas: avisa e remove, em vez de travar
    for (const [an, def] of Object.entries(ch.anims)) {
      const bad = def.frames.filter(fr => !ch.atlas[fr[0]]);
      if (bad.length) console.warn(`${id}.${an}: quadros ausentes`, bad.map(b => b[0]));
      def.frames = def.frames.filter(fr => ch.atlas[fr[0]]);
    }
    ch.height = ch.atlas[ch.anims.idle.frames[0][0]][3];
    ch.hitCache = {};
  }

  // Área de ataque a partir do desenho: a ponta mais avançada (punho, pé, chicote)
  // entre 15% e 75% da altura do quadro.
  function attackBox(ch, name, flip) {
    const key = name + flip;
    if (ch.hitCache[key]) return ch.hitCache[key];
    const [, , w, h, ax] = ch.atlas[name], m = ch.solid[name];
    let best = null;
    for (let j = Math.floor(h * 0.15); j < h * 0.75; j++) for (let i = 0; i < w; i++) {
      if (!m[j * w + i]) continue;
      const fx = flip ? (w - 1 - i) - (w - ax) : i - ax;
      if (!best || fx > best.fx) best = { fx, y: j - h };
    }
    if (!best) best = { fx: 20, y: -h / 2 };
    return (ch.hitCache[key] = { x: best.fx - 22, y: best.y - 10, w: 24, h: 20 });
  }

  function drawFrame(g, ch, sheet, name, x, y, facing, flipDef, scale = 1) {
    const r = ch.atlas[name];
    if (!r) return;
    const [sx, sy, w, h, ax] = r;
    const mirror = (facing < 0) !== !!flipDef;
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.scale(mirror ? -scale : scale, scale);
    g.drawImage(sheet, sx, sy, w, h, -ax, -h, w, h);
    g.restore();
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
    p1: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", a: "KeyJ", b: "KeyK", c: "KeyL" },
    p2: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", a: "Enter", b: "Period", c: "Slash" },
  };
  const readHuman = m => ({
    left: keys.has(m.left), right: keys.has(m.right), up: keys.has(m.up), down: keys.has(m.down),
    a: pressed.has(m.a), b: pressed.has(m.b), c: pressed.has(m.c),
  });
  const NONE = { left: false, right: false, up: false, down: false, a: false, b: false, c: false };

  // ---------- Animação ----------
  class Anim {
    constructor(ch, name) { this.ch = ch; this.set(name); }
    set(name) {
      this.name = name; this.def = this.ch.anims[name] || this.ch.anims.idle;
      this.i = 0; this.t = 0; this.done = false; this.fired = new Set();
    }
    get frame() { return this.def.frames[this.i]; }
    tick() {
      if (++this.t < this.frame[1]) return;
      this.t = 0;
      if (this.i + 1 < this.def.frames.length) this.i++;
      else if (this.def.loop) this.i = 0;
      else this.done = true;
    }
  }

  class Projectile {
    constructor(owner, spec) {
      this.owner = owner; this.ch = owner.ch; this.spec = spec; this.facing = owner.facing;
      this.x = owner.x + owner.facing * (spec.dx ?? 30); this.y = FLOOR + spec.y;
      this.anim = new Anim(this.ch, spec.anim); this.dead = false;
    }
    box() {
      const [, , w, h] = this.ch.atlas[this.anim.frame[0]];
      return { x: this.x - w * 0.32, y: this.y - h * 0.82, w: w * 0.64, h: h * 0.64 };
    }
    update() {
      this.anim.tick();
      this.x += this.spec.speed * this.facing;
      if (this.x < -100 || this.x > W + 100 || (this.spec.once && this.anim.done)) this.dead = true;
    }
    draw(g) { drawFrame(g, this.ch, this.ch.sheets.p1, this.anim.frame[0], this.x, this.y, this.facing, this.anim.def.flip); }
  }

  class Effect {
    constructor(ch, name, x, y, facing = 1) { this.ch = ch; this.anim = new Anim(ch, name); this.x = x; this.y = y; this.facing = facing; }
    update() { this.anim.tick(); }
    get dead() { return this.anim.done; }
    draw(g) { drawFrame(g, this.ch, this.ch.sheets.p1, this.anim.frame[0], this.x, this.y, this.facing, this.anim.def.flip); }
  }

  // ---------- Lutador ----------
  class Fighter {
    constructor(ch, pal, x, facing) {
      this.ch = ch; this.pal = pal; this.spawnX = x; this.spawnFacing = facing;
      this.reset();
    }
    reset() {
      Object.assign(this, { x: this.spawnX, y: FLOOR, vx: 0, vy: 0, facing: this.spawnFacing, hp: 100, shownHp: 100,
        state: "idle", stun: 0, flash: 0, hits: new Set(), blocking: false, crouch: false, move: null, cooldown: 0 });
      this.anim = new Anim(this.ch, "idle");
    }
    play(name) { if (this.anim.name !== name) this.anim.set(name); }
    get airborne() { return this.y < FLOOR; }
    get busy() { return ["attack", "hit", "ko", "win"].includes(this.state); }

    hurtbox() {
      const full = Math.min(110, this.ch.height);
      const h = this.state === "ko" ? 30 : (this.crouch || this.state === "block") ? full * 0.68 : full;
      return { x: this.x - 17, y: this.y - h, w: 34, h };
    }
    hitbox() {
      const tag = this.anim.frame[2];
      if (this.state !== "attack" || !tag || !tag.startsWith("hit") || this.hits.has(tag)) return null;
      const b = attackBox(this.ch, this.anim.frame[0], this.anim.def.flip);
      const x = this.facing > 0 ? this.x + b.x : this.x - b.x - b.w;
      return { x, y: this.y + b.y, w: b.w, h: b.h, tag };
    }
    startMove(name) {
      const mv = this.ch.moves[name];
      if (!mv) return;
      this.state = "attack"; this.move = mv; this.hits = new Set(); this.crouch = false;
      this.anim.set(mv.anim);
      if (mv.sfx) Sound.play(mv.sfx);
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
        const fr = this.anim.frame;
        if (fr[2] === "spawn" && !this.anim.fired.has(this.anim.i) && this.move.proj) {
          this.anim.fired.add(this.anim.i);
          world.projectiles.push(new Projectile(this, this.move.proj));
          if (this.move.proj.sfx) Sound.play(this.move.proj.sfx);
          this.cooldown = 70;
        }
        if (this.anim.done) { this.state = "idle"; this.move = null; }
      } else if (!this.airborne) {
        this.crouch = input.down; this.blocking = back; this.vx = 0;
        const projOut = world.projectiles.some(p => p.owner === this);
        const want = ["a", "b", "c"].find(k => input[k]);
        const moveName = want && this.ch.buttons[want];
        const isProj = moveName && this.ch.moves[moveName]?.proj;
        if (moveName && !(isProj && (projOut || this.cooldown))) this.startMove(moveName);
        else if (input.up) {
          this.vy = this.ch.jumpV; this.vx = fwd ? 2.2 * this.facing : back ? -2.2 * this.facing : 0;
          this.state = "jump"; this.crouch = false; this.anim.set("jump");
        }
        else if (this.crouch) this.state = back ? "block" : "crouch";
        else if (fwd) { this.vx = this.ch.walkSpeed * this.facing; this.state = "walk"; }
        else if (back) { this.vx = -this.ch.backSpeed * this.facing; this.state = "back"; }
        else this.state = "idle";
      }

      this.x += this.vx;
      if (this.airborne || this.vy < 0) {
        this.vy += 0.32; this.y += this.vy;
        if (this.y >= FLOOR) { this.y = FLOOR; this.vy = 0; if (this.state === "jump") this.state = "idle"; }
      }
      this.x = Math.max(24, Math.min(W - 24, this.x));
      this.shownHp += (this.hp - this.shownHp) * 0.08;

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
      Sound.play("hit");
      if (this.hp === 0) {
        this.state = "ko"; this.vx = dir * 2.2;
        this.anim.set(spec.burn ? "burn" : "fall");
        Sound.play("ko", this.ch.voice);
      } else {
        this.state = "hit"; this.stun = spec.hitstun ?? 20; this.vx = dir * (spec.push ?? 3); this.anim.set("hit");
        Sound.play("pain", this.ch.voice);
      }
      return "hit";
    }

    draw(g, debug) {
      const sheet = this.flash ? this.ch.sheets.white : this.ch.sheets[this.pal];
      g.fillStyle = "rgba(0,0,0,0.35)";
      const sw = 24 - Math.min(10, (FLOOR - this.y) / 6);
      g.beginPath(); g.ellipse(Math.round(this.x), FLOOR + 1, sw, 3.5, 0, 0, Math.PI * 2); g.fill();
      const shake = this.state === "hit" && this.stun > 8 ? ((this.stun & 2) ? 1 : -1) : 0;
      drawFrame(g, this.ch, sheet, this.anim.frame[0], this.x + shake, this.y, this.facing, this.anim.def.flip);
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
      cpu.hold = dist > 150 ? (r < 0.25 ? { c: true } : { [toward]: true })
        : dist > 75 ? (r < 0.55 ? { [toward]: true } : r < 0.7 ? { up: true, [toward]: true } : r < 0.85 ? { c: true } : { b: true })
        : r < 0.3 ? { a: true } : r < 0.45 ? { b: true } : r < 0.6 ? { [away]: true } : r < 0.7 ? { down: true } : {};
    }
    Object.assign(out, cpu.hold);
    if (cpu.hold.a || cpu.hold.b || cpu.hold.c) cpu.hold = {};
    if (cpu.hold.up) cpu.hold = { [toward]: true };
    return out;
  }

  // ---------- Cenas ----------
  let scene = "select", debug = false, p2Human = false, fighters = [];
  const world = { projectiles: [], effects: [] };
  const match = { time: 99, frame: 0, banner: "", bannerT: 0, over: false, hitstop: 0 };
  const timers = [];
  const sel = { p1: 0, p2: 1, stage: "p1", t: 0 };

  function showBanner(t, d) { match.banner = t; match.bannerT = d; }
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function startFight() {
    const c1 = CHARS[ROSTER[sel.p1]], c2 = CHARS[ROSTER[sel.p2]];
    fighters = [new Fighter(c1, "p1", 120, 1), new Fighter(c2, c1 === c2 ? "p2" : "p1", 264, -1)];
    scene = "fight";
    resetRound();
  }
  function resetRound() {
    timers.splice(0).forEach(clearTimeout);
    fighters.forEach(f => f.reset());
    world.projectiles = []; world.effects = [];
    Object.assign(match, { time: 99, frame: 0, over: false, hitstop: 0 });
    showBanner("FIGHT!", 70);
    Sound.play("fight");
  }
  function toSelect() {
    timers.splice(0).forEach(clearTimeout);
    scene = "select"; sel.stage = "p1";
  }

  function stepSelect() {
    sel.t++;
    const n = ROSTER.length;
    const move = (who, d) => { sel[who] = (sel[who] + d + n) % n; Sound.play("blip"); };
    if (Object.values(MAP.p2).some(k => pressed.has(k))) p2Human = true;
    if (sel.stage === "p1") {
      if (pressed.has(MAP.p1.left)) move("p1", -1);
      if (pressed.has(MAP.p1.right)) move("p1", 1);
      if (pressed.has(MAP.p1.a)) { sel.stage = "p2"; Sound.play("select"); }
    } else if (sel.stage === "p2") {
      // sem segundo jogador, o P1 escolhe o adversário da CPU
      const m = p2Human ? MAP.p2 : MAP.p1;
      if (pressed.has(m.left)) move("p2", -1);
      if (pressed.has(m.right)) move("p2", 1);
      if (pressed.has(m.a)) { Sound.play("select"); startFight(); }
      if (pressed.has("Escape") || pressed.has("Backspace")) sel.stage = "p1";
    }
  }

  function stepFight() {
    if (pressed.has("KeyH")) debug = !debug;
    if (pressed.has("KeyR")) resetRound();
    if (pressed.has("Escape")) { toSelect(); return; }
    if (pressed.has("Digit1")) { cpu.mode = cpu.mode === "ai" ? "dummy" : "ai"; p2Human = false; showBanner(cpu.mode === "ai" ? "CPU" : "TREINO", 50); }
    if (Object.values(MAP.p2).some(k => pressed.has(k))) p2Human = true;
    if (match.hitstop > 0) { match.hitstop--; return; }

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
        att.hits.add(hb.tag);
        const res = def.takeHit(att.move, att.facing);
        match.hitstop = res === "hit" ? 7 : 4;
        world.effects.push(new Effect(att.ch, att.ch.impact, hb.x + hb.w / 2 + att.facing * 4, hb.y + hb.h + 24, att.facing));
      }
    }
    for (const p of world.projectiles) {
      p.update();
      const foe = p.owner === a ? b : a;
      if (!p.dead && foe.state !== "ko" && overlap(p.box(), foe.hurtbox())) {
        p.dead = true;
        const res = foe.takeHit({ ...p.spec, hitstun: 26, push: 3.5 }, p.facing);
        match.hitstop = res === "hit" ? 8 : 4;
        world.effects.push(new Effect(p.ch, p.spec.boom || p.ch.impact, p.x, Math.min(FLOOR, p.y + 20), p.facing));
        Sound.play("boom");
      }
    }
    const [p1, p2] = [world.projectiles.find(p => p.owner === a), world.projectiles.find(p => p.owner === b)];
    if (p1 && p2 && overlap(p1.box(), p2.box())) {
      p1.dead = p2.dead = true;
      world.effects.push(new Effect(p1.ch, p1.spec.boom || p1.ch.impact, (p1.x + p2.x) / 2, p1.y + 20));
      Sound.play("boom");
    }
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
          showBanner(winner ? winner.ch.name + " VENCE" : "EMPATE", 160);
        }, 1600));
        timers.push(setTimeout(resetRound, 5200));
      }
    }
  }

  function step() {
    if (pressed.has("KeyM")) showBanner(Sound.toggleMute() ? "SOM OFF" : "SOM ON", 50);
    if (scene === "select") stepSelect(); else stepFight();
    if (scene === "select" && match.bannerT > 0) match.bannerT--;
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

  function drawSelect(g) {
    const bgG = g.createLinearGradient(0, 0, 0, H);
    bgG.addColorStop(0, "#120e22"); bgG.addColorStop(1, "#2b1638");
    g.fillStyle = bgG; g.fillRect(0, 0, W, H);
    text(g, "ESCOLHA SEU LUTADOR", W / 2, 8, 14, "#ffe066", "center");
    const n = ROSTER.length, slotW = 64, gap = 6, x0 = (W - (n * slotW + (n - 1) * gap)) / 2, y0 = 142;
    // retratos grandes dos dois escolhidos
    const big = (idx, x, facing, label, color) => {
      const ch = CHARS[ROSTER[idx]];
      const fr = ch.anims.idle.frames[Math.floor(sel.t / 8) % ch.anims.idle.frames.length][0];
      drawFrame(g, ch, ch.sheets.p1, fr, x, 138, facing, ch.anims.idle.flip, 0.92);
      text(g, label + " · " + ch.fullName.toUpperCase(), x, 26, 9, color, "center");
    };
    big(sel.p1, 74, 1, "P1", "#ff6a6a");
    if (sel.stage !== "p1") big(sel.p2, W - 74, -1, p2Human ? "P2" : "CPU", "#6ab8ff");
    ROSTER.forEach((id, i) => {
      const ch = CHARS[id], x = x0 + i * (slotW + gap);
      g.fillStyle = "#1d1830"; g.fillRect(x, y0, slotW, 62);
      g.save(); g.beginPath(); g.rect(x, y0, slotW, 62); g.clip();
      // retrato: rosto e tronco, recortados da pose parada
      drawFrame(g, ch, ch.sheets.p1, ch.anims.idle.frames[0][0], x + slotW / 2, y0 + 4 + ch.height * 0.85, 1, ch.anims.idle.flip, 0.85);
      g.restore();
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(x, y0 + 51, slotW, 11);
      text(g, ch.name, x + slotW / 2, y0 + 52, 7, "#fff", "center");
      const blink = (sel.t >> 3) & 1;
      if (i === sel.p1) { g.strokeStyle = blink || sel.stage !== "p1" ? "#ff4a4a" : "#ffb0b0"; g.lineWidth = 2; g.strokeRect(x - 1, y0 - 1, slotW + 2, 64); }
      if (sel.stage !== "p1" && i === sel.p2) { g.strokeStyle = blink ? "#4aa8ff" : "#b0d8ff"; g.lineWidth = 2; g.strokeRect(x + 2, y0 + 2, slotW - 4, 58); }
      g.lineWidth = 1;
    });
    const hint = sel.stage === "p1" ? "A/D escolhe · J confirma" : (p2Human ? "P2: setas escolhe · Enter confirma" : "escolha o adversário · J confirma · Esc volta");
    text(g, hint, W / 2, 211, 8, "#cfc6e8", "center");
    if (!Sound.ready) text(g, "aperte qualquer tecla para ligar o som", W / 2, 20, 7, "#ffe9a8", "center");
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
    text(g, a.ch.name, 12, 24, 9, "#fff");
    text(g, b.ch.name + (p2Human ? "" : cpu.mode === "ai" ? " (CPU)" : " (TREINO)"), W - 12, 24, 9, "#fff", "right");
    text(g, String(match.time).padStart(2, "0"), W / 2, 8, 16, "#f3d23a", "center");
    if (match.bannerT > 0) text(g, match.banner, W / 2, 70, 28, "#ffe066", "center");
    if (!Sound.ready) text(g, "aperte qualquer tecla para ligar o som", W / 2, H - 12, 8, "#ffe9a8", "center");
    if (debug) text(g, `P1 ${a.state}/${a.anim.frame[0]}  P2 ${b.state}/${b.anim.frame[0]}`, 6, H - 12, 8, "#9fe");
  }

  function render() {
    if (scene === "select") { drawSelect(ctx); if (match.bannerT > 0) text(ctx, match.banner, W / 2, 90, 20, "#ffe066", "center"); return; }
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

  ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText("carregando...", 8, 20);
  Promise.all(ROSTER.map(loadChar)).then(() => requestAnimationFrame(loop)).catch(err => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.font = "10px monospace";
    ctx.fillText(err.message + " (abra via servidor http)", 8, 20);
  });

  // ganchos de teste (usados pelos testes automáticos)
  window.__ufs = { sel, get fighters() { return fighters; }, get scene() { return scene; }, startFight, cpu };
})();
