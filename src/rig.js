// Rig vetorial em pixel art.
// O corpo é um esqueleto (ossos com ângulos) desenhado por formas vetoriais (cápsulas e
// polígonos) que são rasterizadas direto na grade de pixels, com contorno e 3 tons de
// sombreado por material. Só o rosto vem da folha de referência, para manter a semelhança.
// Qualquer pose nova = uma lista de ângulos (ver GABY_POSES).
(() => {
  "use strict";

  // ---------- Paleta (cores tiradas da folha de referência) ----------
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
  const mat = (line, dark, shade, base, light) => ({ line: hex(line), dark: hex(dark), shade: hex(shade), base: hex(base), light: hex(light) });
  // cores conferidas com a folha "MODEL SHEET – GABY" (frente, 3/4, perfil, costas)
  const MAT = {
    skin:  mat("#5a3428", "#9a5a44", "#c97f5e", "#eba67f", "#f8c7a0"),
    shirt: mat("#111016", "#17161d", "#1e1d25", "#27262f", "#3a3944"),
    pants: mat("#101018", "#151520", "#1b1c2a", "#232536", "#323a58"),
    hair:  mat("#2a1c16", "#3e2a20", "#5a3c2a", "#7c5436", "#a8784c"),
    shoe:  mat("#0c0c10", "#141418", "#1c1c22", "#2a2a32", "#45454f"),
    trim:  mat("#3a0c10", "#5a1218", "#741820", "#8e1f26", "#b0343a"),
    white: mat("#6d6880", "#9d98b0", "#c9c5d6", "#e6e3ee", "#ffffff"),
  };
  // cabelo do recorte (folha 1, tons avermelhados) -> tons da folha nova
  const HAIR_REMAP = {
    "#33242e": "#3e2a20", "#41282f": "#5a3c2a", "#592a30": "#5a3c2a",
    "#684242": "#7c5436", "#785251": "#a8784c", "#2c202c": "#2a1c16",
  };
  const back = m => ({ line: m.line, dark: m.dark, shade: m.dark, base: m.shade, light: m.base });

  // luz vinda de cima e um pouco da frente
  const LX = 0.35, LY = -0.94;

  // ---------- Rasterizador ----------
  class Raster {
    constructor(w, h) { this.w = w; this.h = h; this.img = new ImageData(w, h); }
    put(x, y, c) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = (y * this.w + x) * 4, d = this.img.data;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3];
    }
    tone(m, s) { return s > 0.42 ? m.light : s < -0.62 ? m.dark : s < -0.22 ? m.shade : m.base; }

    // cápsula afunilada de a até b, raios r1 -> r2
    capsule(a, b, r1, r2, m) {
      const minX = Math.floor(Math.min(a[0] - r1, b[0] - r2)) - 1, maxX = Math.ceil(Math.max(a[0] + r1, b[0] + r2)) + 1;
      const minY = Math.floor(Math.min(a[1] - r1, b[1] - r2)) - 1, maxY = Math.ceil(Math.max(a[1] + r1, b[1] + r2)) + 1;
      const abx = b[0] - a[0], aby = b[1] - a[1], len2 = abx * abx + aby * aby || 1e-6;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const t = Math.max(0, Math.min(1, ((px - a[0]) * abx + (py - a[1]) * aby) / len2));
        const cx = a[0] + abx * t, cy = a[1] + aby * t, r = r1 + (r2 - r1) * t;
        const dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy), d = dist - r;
        if (d > 0) continue;
        if (d > -1) { this.put(x, y, m.line); continue; }
        const s = dist > 0 ? (dx * LX + dy * LY) / r : 0;
        this.put(x, y, this.tone(m, s));
      }
    }

    // polígono preenchido; sombreia só perto das bordas
    poly(pts, m, band = 3, grad = null) {
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, area = 0;
      pts.forEach(([x, y], i) => {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        const [x2, y2] = pts[(i + 1) % pts.length]; area += x * y2 - x2 * y;
      });
      const orient = area > 0 ? 1 : -1;
      for (let y = Math.floor(minY) - 1; y <= Math.ceil(maxY); y++) for (let x = Math.floor(minX) - 1; x <= Math.ceil(maxX); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false, best = 1e9, nx = 0, ny = 0;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
          const ex = xi - xj, ey = yi - yj, l2 = ex * ex + ey * ey || 1e-6;
          const t = Math.max(0, Math.min(1, ((px - xj) * ex + (py - yj) * ey) / l2));
          const dd = Math.hypot(px - (xj + ex * t), py - (yj + ey * t));
          if (dd < best) { best = dd; const el = Math.sqrt(l2); nx = -ey / el * orient; ny = ex / el * orient; }
        }
        if (!inside) continue;
        if (best < 1) { this.put(x, y, m.line); continue; }
        const k = Math.max(0, 1 - (best - 1) / band);
        let sh = (nx * LX + ny * LY) * k * 1.2;
        if (grad) sh += ((py - minY) / (maxY - minY || 1)) * grad[1] + grad[0];  // degradê raiz -> pontas
        this.put(x, y, this.tone(m, sh));
      }
    }

    // imagem com rotação (amostragem por vizinho mais próximo = continua pixel art)
    image(src, ax, ay, at, angle) {
      const c = Math.cos(angle), s = Math.sin(angle), sd = src.data;
      const R = Math.ceil(Math.hypot(src.width, src.height));
      for (let y = Math.floor(at[1] - R); y <= at[1] + R; y++) for (let x = Math.floor(at[0] - R); x <= at[0] + R; x++) {
        const dx = x + 0.5 - at[0], dy = y + 0.5 - at[1];
        const sx = Math.floor(dx * c + dy * s + ax), sy = Math.floor(-dx * s + dy * c + ay);
        if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) continue;
        const i = (sy * src.width + sx) * 4;
        if (sd[i + 3] < 128) continue;
        this.put(x, y, [sd[i], sd[i + 1], sd[i + 2], 255]);
      }
    }

    glyphs(text, at, color) {
      const F = { U: ["101", "101", "101", "101", "111"], F: ["111", "100", "110", "100", "100"], S: ["111", "100", "111", "001", "111"] };
      let x0 = Math.round(at[0]), y0 = Math.round(at[1]);
      for (const ch of text) {
        F[ch].forEach((row, j) => [...row].forEach((b, i) => b === "1" && this.put(x0 + i, y0 + j, color)));
        x0 += 4;
      }
    }
  }

  // ---------- Esqueleto ----------
  const L = { uArm: 14, fArm: 13, thigh: 21, shin: 21 };
  const rad = a => a * Math.PI / 180;
  // ângulo absoluto: 0 = para baixo, 90 = para frente, 180 = para cima, -90 = para trás
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const rotP = (p, o, a) => {
    const c = Math.cos(rad(a)), s = Math.sin(rad(a)), x = p[0] - o[0], y = p[1] - o[1];
    return [o[0] + x * c - y * s, o[1] + x * s + y * c];
  };

  const DEFAULT = {
    lean: 4, tilt: 0, head: "neutral", rot: 0, lift: 0, flow: 0,
    armF: [25, 125], armB: [15, 135],     // [ombro, cotovelo]
    legF: [22, 14], legB: [-24, 6],        // [quadril, joelho]
    footF: null, footB: null,
  };

  function solve(pose) {
    const P = Object.assign({}, DEFAULT, pose);
    const lean = P.lean;
    const T = p => rotP(p, [0, 0], lean);           // espaço do tronco -> mundo
    const j = {};
    j.hip = [0, 0];
    j.shF = T([5, -27]); j.shB = T([-5, -28]); j.neck = T([3, -31]);
    j.hipF = T([4, -1]); j.hipB = T([-4, -1]);
    for (const s of ["F", "B"]) {
      const [a1, a2] = P["arm" + s];
      j["el" + s] = add(j["sh" + s], dir(a1), L.uArm);
      j["wr" + s] = add(j["el" + s], dir(a1 + a2), L.fArm);
      j["fi" + s] = add(j["wr" + s], dir(a1 + a2), 3);
      j["sl" + s] = add(j["sh" + s], dir(a1), L.uArm * 0.5);     // fim da manga
      const [h, k] = P["leg" + s];
      j["kn" + s] = add(j["hip" + s], dir(h), L.thigh);
      const shinA = h - k;
      j["an" + s] = add(j["kn" + s], dir(shinA), L.shin);
      const fa = P["foot" + s] ?? (Math.abs(shinA) > 70 ? shinA + 80 : 90);
      j["fa" + s] = fa;
      j["to" + s] = add(j["an" + s], dir(fa), 8);
    }
    // giro do corpo inteiro (quedas)
    const rot = P.rot;
    if (rot) for (const k in j) if (Array.isArray(j[k])) j[k] = rotP(j[k], [0, 0], -rot);
    // apoia no chão: o ponto mais baixo encosta em y = 0
    const low = ["anF", "anB", "toF", "toB", "fiF", "fiB", "elF", "elB", "neck", "shF", "shB", "hip", "knF", "knB"]
      .reduce((m, k) => Math.max(m, j[k][1] + (k.startsWith("an") || k.startsWith("to") ? 4 : 5)), -1e9);
    const dy = -low - P.lift;
    for (const k in j) if (Array.isArray(j[k])) j[k] = [j[k][0], j[k][1] + dy];
    return { P, j, lean, rot };
  }

  // ---------- Desenho ----------
  const CW = 150, CH = 136, AX = 72, GY = 132;  // tamanho do quadro e ponto dos pés

  function render(pose, heads) {
    const { P, j, lean, rot } = solve(pose);
    const R = new Raster(CW, CH);
    const o = p => [p[0] + AX, p[1] + GY];
    const T = p => { const q = rotP(rotP(p, [0, 0], lean), [0, 0], -rot); return [q[0] + j.hip[0] + AX, q[1] + j.hip[1] + GY]; };
    const ang = lean - rot;

    const arm = (s, darker) => {
      const sk = darker ? back(MAT.skin) : MAT.skin, sh = darker ? back(MAT.shirt) : MAT.shirt;
      R.capsule(o(j["el" + s]), o(j["wr" + s]), 4, 3.6, sk);
      R.capsule(o(j["sh" + s]), o(j["el" + s]), 4.6, 4.2, sk);
      R.capsule(o(j["sh" + s]), o(j["sl" + s]), 5.6, 5.4, sh);
      R.capsule(o(j["sl" + s]), o(j["sl" + s]), 5.4, 5.4, darker ? back(MAT.trim) : MAT.trim);
      R.capsule(o(j["sh" + s]), o(add(j["sl" + s], [j["sh" + s][0] - j["sl" + s][0], j["sh" + s][1] - j["sl" + s][1]], 0.25)), 5.6, 5.3, sh);
      R.capsule(o(j["fi" + s]), o(j["fi" + s]), 4.6, 4.6, sk);
      if (s === "F") R.capsule(o(add(j["wr" + s], [j["el" + s][0] - j["wr" + s][0], j["el" + s][1] - j["wr" + s][1]], 0.12)), o(j["wr" + s]), 3.7, 3.7, MAT.white);
    };
    const leg = (s, darker) => {
      const pa = darker ? back(MAT.pants) : MAT.pants, so = darker ? back(MAT.shoe) : MAT.shoe;
      const an = j["an" + s], to = j["to" + s], heel = add(an, dir(j["fa" + s]), -2);
      R.capsule(o(heel), o(to), 3.2, 2.8, so);
      R.capsule(o(j["kn" + s]), o(an), 6, 6.6, pa);      // calça larga, abre na barra
      R.capsule(o(j["hip" + s]), o(j["kn" + s]), 7.6, 6.2, pa);
    };

    // cabelo atrás das costas (balança com P.flow)
    const headAng = ang + P.tilt;
    const H = p => { const q = rotP(p, [0, 0], headAng); return [q[0] + j.neck[0] + AX, q[1] + j.neck[1] + GY]; };
    const f = P.flow;

    arm("B", true);
    leg("B", true);
    R.poly([[-2, -21], [-10, -18], [-14, -8], [-16 - f, 6], [-16 - f * 1.5, 18], [-12 - f * 1.8, 27], [-6 - f, 22], [-3, 10], [-1, 0]].map(H), MAT.hair, 2, [-0.5, 1.1]);
    // mecha que cai sobre o ombro da frente (como na vista 3/4)
    const lock = [[4, -4], [9, 2], [10, 12], [7, 17], [5, 8], [2, 2]].map(H);
    R.poly([[-14, -9], [12, -9], [14, 2], [6, 5], [-12, 5], [-17, -1]].map(T), MAT.pants, 2);   // quadril (largo, como na folha)
    leg("F", false);
    R.poly([[-13, -7], [12, -7], [14, -16], [15, -25], [11, -31], [-9, -31], [-15, -25], [-14, -16]].map(T), MAT.shirt, 3);
    for (let x = -11; x <= 11; x++) { const p = T([x, -8]); R.put(Math.floor(p[0]), Math.floor(p[1]), MAT.pants.line); }  // cinto
    R.poly([[-4, -32], [6, -32], [2, -26]].map(T), MAT.shirt, 1);                     // gola polo
    R.glyphs("UFS", T([-1, -22]), MAT.white.light);
    R.capsule(o(j.neck), o(add(j.neck, dir(180 + headAng), 4)), 3.6, 3.6, MAT.skin); // pescoço
    const hd = heads[P.head] || heads.neutral;
    R.image(hd.data, hd.ax, hd.ay, H([0, 1]), rad(headAng));
    R.poly(lock, MAT.hair, 2, [-0.3, 0.9]);
    arm("F", false);
    return { image: R.img, joints: j, ax: AX, gy: GY };
  }

  // Rostos recortados da folha (já reduzidos em assets/sprites/gaby/*.png)
  const HEADS = {
    neutral: { src: "assets/sprites/gaby/idle.png",  sx: 26, sy: 0, sw: 26, sh: 21, ax: 14, ay: 20 },
    attack:  { src: "assets/sprites/gaby/punch.png", sx: 21, sy: 0, sw: 25, sh: 20, ax: 13, ay: 19 },
  };

  async function loadHeads() {
    const out = {};
    for (const [k, h] of Object.entries(HEADS)) {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = h.src; });
      const c = document.createElement("canvas"); c.width = h.sw; c.height = h.sh;
      const g = c.getContext("2d"); g.drawImage(img, -h.sx, -h.sy);
      const d = g.getImageData(0, 0, h.sw, h.sh);
      const remap = {};
      for (const [a, b] of Object.entries(HAIR_REMAP)) remap[hex(a).slice(0, 3).join()] = hex(b);
      for (let i = 0; i < d.data.length; i += 4) {
        const to = remap[[d.data[i], d.data[i + 1], d.data[i + 2]].join()];
        if (to) { d.data[i] = to[0]; d.data[i + 1] = to[1]; d.data[i + 2] = to[2]; }
      }
      // máscara oval: descarta ombro e camisa que vieram junto no recorte
      for (let y = 0; y < h.sh; y++) for (let x = 0; x < h.sw; x++) {
        const ex = (x + 0.5 - h.sw * 0.52) / (h.sw * 0.52), ey = (y + 0.5 - h.sh * 0.5) / (h.sh * 0.55);
        if (ex * ex + ey * ey > 1) d.data[(y * h.sw + x) * 4 + 3] = 0;
      }
      out[k] = { data: d, ax: h.ax, ay: h.ay };
    }
    return out;
  }

  // ---------- Biblioteca de poses da Gaby ----------
  // armX: [ombro, cotovelo]   legX: [quadril, joelho]   (graus; 0 = para baixo, 90 = para frente)
  const GABY_POSES = {
    idle1:   { lean: 4,  armF: [28, 122], armB: [12, 140], legF: [24, 16], legB: [-24, 6], flow: 0 },
    idle2:   { lean: 5,  armF: [26, 124], armB: [10, 142], legF: [26, 22], legB: [-22, 10], flow: 1 },
    idle3:   { lean: 6,  armF: [24, 126], armB: [9, 144],  legF: [28, 28], legB: [-20, 14], flow: 2 },
    walk1:   { lean: 7,  armF: [30, 118], armB: [14, 136], legF: [30, 20], legB: [-20, 6], flow: 2 },
    walk2:   { lean: 7,  armF: [28, 120], armB: [12, 138], legF: [8, 18],  legB: [0, 30], flow: 3 },
    walk3:   { lean: 7,  armF: [30, 118], armB: [14, 136], legF: [-18, 8], legB: [26, 16], flow: 2 },
    walk4:   { lean: 7,  armF: [28, 120], armB: [12, 138], legF: [2, 30],  legB: [6, 16], flow: 3 },
    jump:    { lean: 2,  armF: [50, 110], armB: [30, 120], legF: [80, 110], legB: [30, 100], flow: 6 },
    crouch:  { lean: 18, armF: [40, 110], armB: [20, 130], legF: [75, 115], legB: [-5, 120], flow: 3 },
    block:   { lean: -4, armF: [70, 105], armB: [55, 118], legF: [26, 22], legB: [-28, 6], tilt: 8, flow: 1 },
    cblock:  { lean: 10, armF: [70, 105], armB: [55, 118], legF: [75, 115], legB: [-5, 120], tilt: 8, flow: 3 },
    punch1:  { lean: 0,  armF: [-10, 150], armB: [30, 120], legF: [28, 20], legB: [-24, 6], head: "attack" },
    punch2:  { lean: 14, armF: [96, 4],   armB: [20, 135], legF: [36, 26], legB: [-34, 4], head: "attack", flow: 4 },
    punch3:  { lean: 8,  armF: [60, 60],  armB: [14, 138], legF: [30, 20], legB: [-28, 6], head: "attack", flow: 2 },
    kick1:   { lean: -6, armF: [40, 110], armB: [20, 130], legF: [80, 120], legB: [-4, 4], head: "attack" },
    kick2:   { lean: -22, armF: [50, 100], armB: [-20, 130], legF: [100, 4], legB: [-6, 2], head: "attack", flow: 5, footF: 150 },
    kick3:   { lean: -8, armF: [40, 110], armB: [20, 130], legF: [60, 70], legB: [-6, 4], head: "attack", flow: 3 },
    hit1:    { lean: -18, tilt: -14, armF: [-20, 40], armB: [-40, 30], legF: [16, 10], legB: [-30, 10], flow: -4 },
    hit2:    { lean: -26, tilt: -20, armF: [-40, 30], armB: [-60, 20], legF: [10, 6],  legB: [-34, 14], flow: -6 },
    fall1:   { rot: 40,  tilt: -20, armF: [-60, 30], armB: [-80, 20], legF: [40, 30], legB: [10, 20], flow: -6, lift: 10 },
    down:    { rot: 88,  tilt: -10, armF: [-140, 10], armB: [-120, 10], legF: [20, 30], legB: [4, 10], flow: -2 },
    win1:    { lean: 0,  armF: [178, -6], armB: [-25, -95], legF: [12, 4], legB: [-12, 4], head: "attack", flow: 1 },
    win2:    { lean: -3, armF: [172, -10], armB: [-25, -95], legF: [12, 4], legB: [-12, 4], head: "attack", flow: 3, lift: 1 },
    special1:{ lean: -6, armF: [-40, 90], armB: [-50, 100], legF: [30, 26], legB: [-30, 8], head: "attack", flow: 2 },
    special2:{ lean: 16, armF: [88, 8],  armB: [80, 14], legF: [40, 30], legB: [-38, 4], head: "attack", flow: 6 },
  };

  window.Rig = { render, solve, loadHeads, GABY_POSES, DEFAULT, CW, CH, AX, GY };
})();
