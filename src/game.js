// UFS Fighter — protótipo da Etapa 1 (personagem Gaby)
// Canvas 384x224, 60 quadros/s fixos, sprites em pixel art com paleta de 32 cores.
(() => {
  "use strict";

  const W = 384, H = 224, FLOOR = 200;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // ---------- Dados da personagem ----------
  // ax = ponto dos pés (centro do corpo) dentro do quadro, em pixels do sprite.
  // hit = caixa de ataque relativa ao canto sup. esquerdo do quadro.
  const GABY = {
    name: "GABY",
    frames: {
      idle:  { src: "assets/sprites/gaby/idle.png",  ax: 33 },
      punch: { src: "assets/sprites/gaby/punch.png", ax: 33, hit: { x: 66, y: 18, w: 22, h: 16 } },
      block: { src: "assets/sprites/gaby/block.png", ax: 31 },
    },
    walkSpeed: 1.6, backSpeed: 1.2, jumpV: -6.2, gravity: 0.32,
    punch: { startup: 3, active: 5, recovery: 9, damage: 8, hitstun: 16, blockstun: 11, push: 3.2, chip: 1 },
    hurt: { w: 30, stand: 100, low: 66 },
  };

  // Paleta alternativa do P2 (troca de paleta estilo SNES): roupa escura vira azul-marinho.
  function recolor(img, fn) {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      if (!d.data[i + 3]) continue;
      const [r, gg, b] = fn(d.data[i], d.data[i + 1], d.data[i + 2]);
      d.data[i] = r; d.data[i + 1] = gg; d.data[i + 2] = b;
    }
    g.putImageData(d, 0, 0);
    return c;
  }
  const altPalette = (r, g, b) => {
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 22;
    if (lum < 62 && neutral) return [r * 0.6, g * 0.8, Math.min(255, b * 1.9 + 20)];
    return [r, g, b];
  };
  const flash = () => [255, 255, 255];

  function loadImage(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("falha ao carregar " + src));
      i.src = src;
    });
  }

  async function loadCharacter(def) {
    const sets = { p1: {}, p2: {}, white: {} };
    for (const [k, f] of Object.entries(def.frames)) {
      const img = await loadImage(f.src);
      sets.p1[k] = img;
      sets.p2[k] = recolor(img, altPalette);
      sets.white[k] = recolor(img, flash);
    }
    return sets;
  }

  // ---------- Entrada ----------
  const keys = new Set();
  const pressed = new Set();
  addEventListener("keydown", e => {
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
    if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  });
  addEventListener("keyup", e => keys.delete(e.code));
  document.querySelectorAll("#touch button").forEach(b => {
    const k = b.dataset.k;
    b.addEventListener("pointerdown", e => { e.preventDefault(); if (!keys.has(k)) pressed.add(k); keys.add(k); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, () => keys.delete(k)));
  });

  const MAP = {
    p1: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", punch: "KeyJ" },
    p2: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", punch: "Enter" },
  };
  const readHuman = m => ({
    left: keys.has(m.left), right: keys.has(m.right), up: keys.has(m.up), down: keys.has(m.down),
    punch: pressed.has(m.punch),
  });

  // ---------- Lutador ----------
  class Fighter {
    constructor(def, sprites, pal, x, facing, label) {
      this.def = def; this.sprites = sprites; this.pal = pal; this.label = label;
      this.spawnX = x; this.spawnFacing = facing;
      this.reset();
    }
    reset() {
      this.x = this.spawnX; this.y = FLOOR; this.vx = 0; this.vy = 0;
      this.facing = this.spawnFacing; this.hp = 100; this.shownHp = 100;
      this.state = "idle"; this.t = 0; this.stun = 0; this.flash = 0;
      this.hasHit = false; this.blocking = false; this.crouch = false;
    }
    get airborne() { return this.y < FLOOR; }
    get frameKey() {
      if (this.state === "punch") return this.t >= this.def.punch.startup ? "punch" : "idle";
      if (this.state === "block" || this.crouch || this.state === "hit" && this.blocking) return "block";
      return "idle";
    }
    hurtbox() {
      const h = this.crouch || this.state === "block" ? this.def.hurt.low : this.def.hurt.stand;
      return { x: this.x - this.def.hurt.w / 2, y: this.y - h, w: this.def.hurt.w, h };
    }
    hitbox() {
      const p = this.def.punch;
      if (this.state !== "punch" || this.t < p.startup || this.t >= p.startup + p.active || this.hasHit) return null;
      const f = this.def.frames.punch, img = this.sprites.p1.punch, hb = f.hit;
      const top = this.y - img.height;
      const relX = hb.x - f.ax;
      const x = this.facing > 0 ? this.x + relX : this.x - relX - hb.w;
      return { x, y: top + hb.y, w: hb.w, h: hb.h };
    }
    update(input, foe) {
      this.t++;
      if (this.flash) this.flash--;
      if (!this.airborne && this.state !== "punch") this.facing = foe.x >= this.x ? 1 : -1;
      const back = this.facing > 0 ? input.left : input.right;
      const fwd = this.facing > 0 ? input.right : input.left;

      if (this.state === "hit") {
        this.stun--;
        this.vx *= 0.82;
        if (this.stun <= 0) { this.state = "idle"; this.blocking = false; }
      } else if (this.state === "ko") {
        this.vx *= 0.9;
      } else if (this.state === "punch") {
        const p = this.def.punch;
        if (!this.airborne) this.vx = 0;
        if (this.t >= p.startup + p.active + p.recovery) this.state = "idle";
      } else if (!this.airborne) {
        this.crouch = input.down;
        this.blocking = back;
        this.vx = 0;
        if (input.punch) { this.state = "punch"; this.t = 0; this.hasHit = false; this.crouch = false; }
        else if (input.up) { this.vy = this.def.jumpV; this.vx = fwd ? 2 * this.facing : back ? -2 * this.facing : 0; this.state = "jump"; this.crouch = false; }
        else if (this.crouch) { this.state = back ? "block" : "crouch"; }
        else if (fwd) { this.vx = this.def.walkSpeed * this.facing; this.state = "walk"; }
        else if (back) { this.vx = -this.def.backSpeed * this.facing; this.state = "walkback"; }
        else this.state = "idle";
      } else if (input.punch && this.state === "jump") {
        this.state = "punch"; this.t = 0; this.hasHit = false;
      }

      this.x += this.vx;
      if (this.airborne || this.vy < 0) {
        this.vy += this.def.gravity;
        this.y += this.vy;
        if (this.y >= FLOOR) {
          this.y = FLOOR; this.vy = 0;
          if (this.state === "jump" || this.state === "punch") this.state = "idle";
        }
      }
      this.x = Math.max(24, Math.min(W - 24, this.x));
      this.shownHp += (this.hp - this.shownHp) * 0.08;
    }
    takeHit(attacker) {
      const p = attacker.def.punch;
      const canBlock = this.blocking && !this.airborne && ["idle", "walkback", "block", "crouch", "hit"].includes(this.state);
      if (canBlock) {
        this.hp = Math.max(1, this.hp - p.chip);
        this.state = "hit"; this.stun = p.blockstun; this.vx = attacker.facing * p.push * 0.8;
        return "block";
      }
      this.hp = Math.max(0, this.hp - p.damage);
      this.blocking = false; this.crouch = false;
      this.flash = 4;
      if (this.hp === 0) { this.state = "ko"; this.vx = attacker.facing * 3; this.vy = -4; this.y -= 1; }
      else { this.state = "hit"; this.stun = p.hitstun; this.vx = attacker.facing * p.push; }
      return "hit";
    }
    draw(g, debug) {
      const key = this.frameKey;
      const img = (this.flash ? this.sprites.white : this.sprites[this.pal])[key];
      const f = this.def.frames[key];
      // respiração / passada: 1 px de balanço, como nos sprites de 16 bits
      let bob = 0;
      if (this.state === "idle") bob = Math.round(Math.sin(this.t / 9) * 0.6 + 0.4);
      if (this.state === "walk" || this.state === "walkback") bob = Math.abs(Math.round(Math.sin(this.t / 5) * 1.4));
      const shakeX = this.state === "hit" && this.stun > 6 ? ((this.t & 2) ? 1 : -1) : 0;

      // sombra
      g.fillStyle = "rgba(0,0,0,0.35)";
      const sw = 22 - Math.min(10, (FLOOR - this.y) / 6);
      g.beginPath(); g.ellipse(Math.round(this.x), FLOOR + 1, sw, 3, 0, 0, Math.PI * 2); g.fill();

      g.save();
      const top = Math.round(this.y - img.height + bob);
      if (this.facing > 0) {
        g.drawImage(img, Math.round(this.x - f.ax + shakeX), top);
      } else {
        g.translate(Math.round(this.x + f.ax + shakeX), top);
        g.scale(-1, 1);
        g.drawImage(img, 0, 0);
      }
      g.restore();

      if (debug) {
        const hb = this.hurtbox();
        g.strokeStyle = "#3cf"; g.strokeRect(hb.x + 0.5, hb.y + 0.5, hb.w, hb.h);
        const ab = this.hitbox();
        if (ab) { g.strokeStyle = "#f33"; g.strokeRect(ab.x + 0.5, ab.y + 0.5, ab.w, ab.h); }
        g.fillStyle = "#fff"; g.fillRect(Math.round(this.x), this.y - 1, 1, 3);
      }
    }
  }

  // ---------- CPU simples ----------
  const cpu = { mode: "ai", timer: 0, hold: {} };
  function cpuInput(me, foe) {
    const dist = Math.abs(foe.x - me.x);
    const toward = foe.x > me.x ? "right" : "left";
    const away = toward === "right" ? "left" : "right";
    const out = { left: false, right: false, up: false, down: false, punch: false };
    if (cpu.mode === "dummy") {
      out[away] = foe.state === "punch"; // boneco: só defende
      return out;
    }
    if (foe.state === "punch" && dist < 80 && Math.random() < 0.6) { out[away] = true; return out; }
    if (--cpu.timer <= 0) {
      cpu.timer = 10 + (Math.random() * 25 | 0);
      const r = Math.random();
      cpu.hold = dist > 70 ? (r < 0.8 ? { [toward]: true } : { up: true, [toward]: true })
        : r < 0.35 ? { punch: true } : r < 0.55 ? { [away]: true } : r < 0.7 ? { down: true } : {};
    }
    Object.assign(out, cpu.hold);
    if (cpu.hold.punch) cpu.hold = {};
    if (cpu.hold.up) cpu.hold = { [toward]: true };
    return out;
  }

  // ---------- Partida ----------
  let sprites, fighters, debug = false, p2Human = false;
  const match = { time: 99, frame: 0, banner: "", bannerT: 0, over: false, hitstop: 0, sparks: [] };

  function resetRound() {
    fighters.forEach(f => f.reset());
    Object.assign(match, { time: 99, frame: 0, over: false, hitstop: 0, sparks: [] });
    showBanner("FIGHT!", 70);
  }
  function showBanner(t, d) { match.banner = t; match.bannerT = d; }

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function step() {
    if (pressed.has("KeyH")) debug = !debug;
    if (pressed.has("KeyR")) resetRound();
    if (pressed.has("Digit1")) { cpu.mode = cpu.mode === "ai" ? "dummy" : "ai"; p2Human = false; showBanner(cpu.mode === "ai" ? "CPU" : "TREINO", 50); }
    if (Object.values(MAP.p2).some(k => pressed.has(k))) p2Human = true;

    if (match.hitstop > 0) { match.hitstop--; pressed.clear(); return; }

    const [a, b] = fighters;
    const live = !match.over;
    const none = { left: false, right: false, up: false, down: false, punch: false };
    a.update(live ? readHuman(MAP.p1) : none, b);
    b.update(live ? (p2Human ? readHuman(MAP.p2) : cpuInput(b, a)) : none, a);

    // empurrão entre corpos
    const dx = b.x - a.x, minD = 36;
    if (Math.abs(dx) < minD && Math.abs(a.y - b.y) < 60) {
      const push = (minD - Math.abs(dx)) / 2 * Math.sign(dx || 1);
      a.x -= push; b.x += push;
    }

    for (const [att, def] of [[a, b], [b, a]]) {
      const hb = att.hitbox();
      if (hb && def.state !== "ko" && overlap(hb, def.hurtbox())) {
        att.hasHit = true;
        const res = def.takeHit(att);
        match.hitstop = res === "hit" ? 6 : 4;
        match.sparks.push({ x: hb.x + hb.w / 2 + att.facing * 6, y: hb.y + hb.h / 2, t: 0, block: res === "block" });
      }
    }

    match.sparks = match.sparks.filter(s => ++s.t < 12);
    if (match.bannerT > 0) match.bannerT--;

    if (!match.over) {
      if (++match.frame % 60 === 0 && match.time > 0) match.time--;
      if (a.hp === 0 || b.hp === 0 || match.time === 0) {
        match.over = true;
        const winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
        showBanner(a.hp === 0 || b.hp === 0 ? "K.O." : "TIME", 120);
        setTimeout(() => showBanner(winner ? winner.label + " VENCE" : "EMPATE", 150), 1600);
        setTimeout(resetRound, 4200);
      }
    }
    pressed.clear();
  }

  // ---------- Desenho ----------
  function drawStage(g) {
    // Cenário provisório — os cenários definitivos são a Etapa 2.
    const sky = g.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, "#1a1440"); sky.addColorStop(0.6, "#5b2a5e"); sky.addColorStop(1, "#c0566a");
    g.fillStyle = sky; g.fillRect(0, 0, W, FLOOR);
    g.fillStyle = "#2a1d3a";
    for (let i = 0; i < 12; i++) { const bx = i * 34 - 6, bh = 40 + ((i * 37) % 50); g.fillRect(bx, FLOOR - 40 - bh, 30, bh + 40); }
    g.fillStyle = "#f2c96b";
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) if ((i * 7 + j * 3) % 5 < 2) g.fillRect(i * 34 + j * 6, FLOOR - 70 + j * 9 - (i % 3) * 8, 3, 4);
    g.fillStyle = "#3d3350"; g.fillRect(0, FLOOR, W, H - FLOOR);
    g.fillStyle = "#4b405f";
    for (let x = 0; x < W; x += 32) g.fillRect(x, FLOOR, 16, H - FLOOR);
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
      g.fillStyle = "#e9e4f5";
      dir > 0 ? g.fillRect(x + w - lag, y, lag, h) : g.fillRect(x, y, lag, h);
      g.fillStyle = f.hp > 30 ? "#f3d23a" : "#ff6a2a";
      dir > 0 ? g.fillRect(x + w - cur, y, cur, h) : g.fillRect(x, y, cur, h);
    };
    bar(a, 12, 1); bar(b, W - 162, -1);
    text(g, a.label, 12, 24, 9, "#fff");
    text(g, b.label + (p2Human ? "" : cpu.mode === "ai" ? " (CPU)" : " (TREINO)"), W - 12, 24, 9, "#fff", "right");
    text(g, String(match.time).padStart(2, "0"), W / 2, 8, 16, "#f3d23a", "center");
    if (match.bannerT > 0) text(g, match.banner, W / 2, 78, 28, "#ffe066", "center");
    if (debug) text(g, `P1 ${a.state}  P2 ${b.state}`, 6, H - 12, 8, "#9fe", "left");
  }

  function drawSparks(g) {
    for (const s of match.sparks) {
      const r = 3 + s.t * 1.2;
      g.strokeStyle = s.block ? "#8cf" : s.t < 4 ? "#fff" : "#ffcf40";
      g.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ang = i * Math.PI / 3 + s.t * 0.1;
        g.beginPath();
        g.moveTo(s.x + Math.cos(ang) * r * 0.4, s.y + Math.sin(ang) * r * 0.4);
        g.lineTo(s.x + Math.cos(ang) * r, s.y + Math.sin(ang) * r);
        g.stroke();
      }
      g.lineWidth = 1;
    }
  }

  function render() {
    drawStage(ctx);
    // quem ataca é desenhado por cima
    const order = [...fighters].sort((p, q) => (p.state === "punch") - (q.state === "punch"));
    order.forEach(f => f.draw(ctx, debug));
    drawSparks(ctx);
    drawHud(ctx);
  }

  // ---------- Laço fixo de 60 Hz ----------
  let last = 0, acc = 0;
  function loop(ts) {
    acc += Math.min(100, ts - (last || ts)); last = ts;
    while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
    render();
    requestAnimationFrame(loop);
  }

  loadCharacter(GABY).then(s => {
    sprites = s;
    fighters = [new Fighter(GABY, s, "p1", 130, 1, "GABY"), new Fighter(GABY, s, "p2", 254, -1, "GABY")];
    resetRound();
    requestAnimationFrame(loop);
  }).catch(err => {
    ctx.fillStyle = "#fff"; ctx.font = "10px monospace";
    ctx.fillText(err.message + " (abra via servidor http)", 8, 20);
  });
})();
