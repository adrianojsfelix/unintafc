// Elenco do UFS Fighter: animações e golpes de cada personagem.
// Quadros: "rLL_fQQ" = linha LL, quadro QQ da folha de sprites do personagem
// (veja assets/sprites/<id>/frames e as tabelas no README).
//
// Quadro de animação: [id, duração em ticks (1/60 s), marca]
//   marca "hit"   = quadro ativo do golpe (área de ataque calculada pelo desenho)
//   marca "hit2"  = novo acerto dentro do mesmo golpe (sequências)
//   marca "spawn" = solta o projétil do golpe
// flip: o desenho original olha para a esquerda e precisa ser espelhado.
// Botões: a = J, b = K, c = L (P2: Enter, ponto, barra).
(() => {
  "use strict";
  const f = (row, i) => `r${String(row).padStart(2, "0")}_f${String(i).padStart(2, "0")}`;
  const seq = (row, from, to, t, tags = {}) => {
    const out = [];
    const step = from <= to ? 1 : -1;
    for (let i = from; step > 0 ? i <= to : i >= to; i += step) out.push([f(row, i), t, tags[i]]);
    return out;
  };
  const hold = (row, i, t = 999) => [[f(row, i), t]];

  const CHARS = {
    gaby: {
      name: "GABY", fullName: "Gaby", voice: 1, color: "#c8202f",
      walkSpeed: 2.0, backSpeed: 1.4, jumpV: -6.4,
      anims: {
        idle:  { loop: true, frames: seq(0, 0, 10, 5) },
        walk:  { loop: true, frames: seq(1, 0, 7, 5) },
        back:  { loop: true, frames: seq(0, 10, 0, 6) },
        jump:  { frames: [[f(6, 1), 5], [f(6, 2), 7], [f(6, 3), 7], [f(6, 4), 7], [f(6, 5), 7], [f(6, 6), 30]] },
        guard: { loop: true, frames: hold(6, 0, 60) },
        punch: { flip: true, frames: [[f(7, 5), 3], [f(7, 3), 6, "hit"], [f(7, 4), 7], [f(7, 5), 5]] },
        fire:  { flip: true, frames: [[f(7, 6), 4], [f(7, 5), 4], [f(7, 0), 4, "spawn"], [f(7, 1), 5], [f(7, 2), 5], [f(7, 3), 6], [f(7, 4), 8]] },
        cat:   { frames: [...seq(8, 3, 8, 4), [f(8, 9), 6, "spawn"], [f(8, 10), 6], [f(8, 11), 8]] },
        hit:   { frames: [[f(9, 0), 7], [f(9, 1), 12]] },
        fall:  { frames: [...seq(9, 2, 8, 6), ...seq(10, 0, 7, 5), ...hold(10, 8)] },
        burn:  { frames: [...seq(11, 0, 7, 4), ...seq(12, 0, 3, 4), ...seq(13, 0, 7, 4), ...seq(14, 0, 7, 5), ...hold(14, 7)] },
        win:   { frames: [[f(8, 0), 8], [f(8, 1), 8], ...hold(8, 2)] },
        fireball: { flip: true, loop: true, frames: seq(6, 7, 10, 4) },
        catrun:   { loop: true, frames: [[f(5, 0), 5], [f(5, 2), 5], [f(5, 3), 5], [f(5, 5), 5], [f(5, 6), 5]] },
        boom:     { frames: seq(3, 0, 9, 3) },
      },
      buttons: { a: "punch", b: "fire", c: "cat" },
      moves: {
        punch: { anim: "punch", damage: 7, hitstun: 18, blockstun: 12, push: 3.2, chip: 1, sfx: "whoosh" },
        fire:  { anim: "fire", proj: { anim: "fireball", speed: 3.4, damage: 12, y: -62, burn: true, sfx: "fire" } },
        cat:   { anim: "cat", proj: { anim: "catrun", speed: 2.4, damage: 10, y: 0, sfx: "meow" } },
      },
      impact: "boom",
    },

    alicia: {
      name: "ALICIA", fullName: "Alicia de Morais", voice: 1.12, color: "#2aa7d6",
      walkSpeed: 1.8, backSpeed: 1.4, jumpV: -6.6,
      anims: {
        idle:  { loop: true, frames: [[f(12, 5), 14], [f(12, 6), 14], [f(12, 4), 14], [f(12, 6), 14]] },
        walk:  { loop: true, frames: seq(0, 2, 10, 5) },
        back:  { loop: true, frames: seq(0, 10, 2, 6) },
        jump:  { frames: [[f(5, 7), 8], [f(5, 8), 10], [f(5, 9), 10], [f(5, 10), 30]] },
        guard: { loop: true, frames: hold(4, 6, 60) },
        // chicotada curta (gira o chicote na altura da cintura)
        punch: { frames: [[f(4, 3), 3], [f(4, 0), 5, "hit"], [f(4, 1), 5, "hit"], [f(4, 2), 6], [f(4, 5), 5]] },
        // chicotada longa: arma, estala à frente e recolhe
        whip:  { frames: [[f(1, 2), 4], [f(1, 3), 4], [f(1, 5), 4], [f(1, 6), 4], [f(2, 0), 5], [f(2, 1), 5],
                          [f(3, 1), 4], [f(3, 3), 7, "hit"], [f(3, 0), 5], [f(12, 4), 6]] },
        // concentra energia e solta a rajada de fogo
        beam:  { frames: [[f(5, 0), 5], [f(5, 1), 5], [f(5, 2), 4], [f(5, 4), 4], [f(5, 6), 4, "spawn"], [f(5, 7), 8], [f(5, 10), 8]] },
        hit:   { frames: [[f(7, 0), 8], [f(7, 1), 12]] },
        fall:  { frames: [...seq(7, 1, 8, 5), ...seq(8, 0, 7, 5), ...hold(8, 8)] },
        burn:  { frames: [...seq(10, 0, 7, 4), ...seq(11, 0, 7, 5), ...hold(11, 8)] },
        win:   { loop: true, frames: [...seq(12, 0, 3, 7), [f(9, 0), 40]] },
        flame: { loop: true, frames: [[f(6, 3), 4], [f(6, 4), 4]] },
        flash: { frames: seq(6, 0, 2, 3) },
      },
      buttons: { a: "punch", b: "whip", c: "beam" },
      moves: {
        punch: { anim: "punch", damage: 6, hitstun: 16, blockstun: 10, push: 2.6, chip: 1, sfx: "whip" },
        whip:  { anim: "whip", damage: 11, hitstun: 22, blockstun: 14, push: 4, chip: 2, sfx: "whip", reach: true },
        beam:  { anim: "beam", proj: { anim: "flame", speed: 4.2, damage: 11, y: -58, burn: true, sfx: "fire", boom: "flash" } },
      },
      impact: "flash",
    },

    adriano: {
      name: "ADRIANO", fullName: "Adriano", voice: 0.62, color: "#3a8ee8",
      walkSpeed: 2.1, backSpeed: 1.5, jumpV: -6.4,
      anims: {
        idle:  { loop: true, frames: [[f(0, 0), 10], [f(0, 1), 10], [f(0, 2), 10], [f(0, 1), 10]] },
        walk:  { loop: true, frames: seq(1, 0, 4, 6) },
        back:  { loop: true, frames: seq(1, 4, 0, 7) },
        jump:  { frames: hold(2, 3, 60) },
        guard: { loop: true, frames: hold(0, 5, 60) },
        punch: { frames: [[f(3, 4), 3], [f(3, 0), 6, "hit"], [f(3, 1), 5], [f(3, 3), 5]] },
        kick:  { frames: [[f(0, 3), 4], [f(2, 0), 4], [f(2, 1), 4, "hit"], [f(2, 2), 6, "hit"], [f(2, 0), 6], [f(0, 4), 4]] },
        blast: { frames: [[f(4, 0), 5], [f(4, 1), 6], [f(4, 2), 6, "spawn"], [f(4, 3), 8], [f(4, 4), 10]] },
        hit:   { frames: [[f(6, 0), 7], [f(6, 1), 12]] },
        fall:  { frames: [[f(6, 2), 10], [f(6, 3), 14], ...hold(6, 4)] },
        burn:  { frames: [...seq(7, 0, 6, 7), ...hold(7, 7)] },
        win:   { frames: [[f(1, 6), 20], ...hold(4, 4)] },
        orb:   { loop: true, frames: [[f(5, 0), 4], [f(5, 1), 4], [f(5, 3), 4]] },
        spark: { frames: [[f(5, 3), 3], [f(5, 4), 4], [f(5, 3), 3]] },
      },
      buttons: { a: "punch", b: "kick", c: "blast" },
      moves: {
        punch: { anim: "punch", damage: 7, hitstun: 18, blockstun: 12, push: 3, chip: 1, sfx: "whoosh" },
        kick:  { anim: "kick", damage: 10, hitstun: 22, blockstun: 14, push: 4, chip: 1, sfx: "whoosh" },
        blast: { anim: "blast", proj: { anim: "orb", speed: 3.6, damage: 12, y: -56, sfx: "energy", boom: "spark" } },
      },
      impact: "spark",
    },

    rogerio: {
      name: "ROGERIO", fullName: "Rogério", voice: 0.56, color: "#8e44e8",
      walkSpeed: 1.8, backSpeed: 1.3, jumpV: -6.0,
      anims: {
        idle:  { loop: true, frames: seq(0, 0, 7, 6) },
        walk:  { loop: true, frames: seq(1, 0, 5, 6) },
        back:  { loop: true, frames: seq(1, 5, 0, 7) },
        jump:  { frames: hold(1, 3, 60) },
        guard: { loop: true, frames: hold(4, 1, 60) },
        punch: { frames: [[f(2, 6), 3], [f(2, 0), 6, "hit"], [f(2, 1), 5], [f(2, 7), 5]] },
        combo: { frames: [[f(2, 6), 3], [f(2, 0), 4, "hit"], [f(2, 7), 3], [f(2, 1), 4, "hit2"], [f(2, 6), 3], [f(2, 2), 5, "hit3"], [f(2, 7), 6]] },
        orb:   { frames: [[f(2, 3), 5], [f(2, 4), 6, "spawn"], [f(2, 5), 10], [f(2, 6), 6], [f(2, 7), 6]] },
        hit:   { frames: [[f(4, 1), 6], [f(4, 2), 12]] },
        fall:  { frames: [...seq(4, 3, 6, 5), ...seq(5, 0, 7, 5), ...seq(6, 0, 2, 6), ...hold(6, 3)] },
        burn:  { frames: [...seq(7, 0, 6, 5), ...seq(8, 0, 6, 5), ...hold(8, 7)] },
        win:   { loop: true, frames: seq(0, 0, 7, 6) },
        sphere: { loop: true, frames: seq(3, 0, 3, 4) },
        pop:   { frames: [[f(3, 7), 4], [f(3, 8), 4], [f(3, 9), 4]] },
      },
      buttons: { a: "punch", b: "combo", c: "orb" },
      moves: {
        punch: { anim: "punch", damage: 7, hitstun: 18, blockstun: 12, push: 3, chip: 1, sfx: "whoosh" },
        combo: { anim: "combo", damage: 5, hitstun: 16, blockstun: 10, push: 1.6, chip: 1, sfx: "whoosh" },
        orb:   { anim: "orb", proj: { anim: "sphere", speed: 3.0, damage: 13, y: -50, sfx: "energy", boom: "pop" } },
      },
      impact: "pop",
    },

    barba: {
      name: "BARBA", fullName: "Barba", voice: 0.5, color: "#ff7a1a",
      walkSpeed: 2.0, backSpeed: 1.4, jumpV: -6.4,
      anims: {
        idle:  { loop: true, frames: seq(1, 0, 3, 8) },
        walk:  { loop: true, frames: seq(0, 6, 10, 6) },
        back:  { loop: true, frames: seq(0, 10, 6, 7) },
        jump:  { frames: [[f(1, 7), 10], [f(1, 8), 14], ...hold(1, 9, 60)] },
        guard: { loop: true, frames: hold(5, 0, 60) },
        punch: { frames: [[f(1, 3), 3], [f(1, 4), 6, "hit"], [f(1, 5), 5], [f(1, 2), 5]] },
        arc:   { frames: [[f(2, 0), 6], [f(2, 0), 4, "spawn"], ...hold(2, 0, 26)] },
        punchfire: { frames: [[f(3, 0), 5], [f(3, 1), 5, "spawn"], [f(3, 2), 10], [f(1, 3), 6]] },
        hit:   { frames: [[f(5, 0), 7], [f(5, 1), 12]] },
        fall:  { frames: [...seq(5, 2, 7, 6), ...seq(6, 4, 5, 8), ...hold(6, 6)] },
        burn:  { frames: [[f(6, 7), 8], [f(6, 8), 8], ...seq(7, 0, 5, 6), ...hold(7, 6)] },
        win:   { loop: true, frames: seq(4, 0, 2, 6) },
        firearc: { frames: seq(2, 1, 4, 5) },
        fireball: { loop: true, frames: [[f(4, 3), 6]] },
        burst: { frames: seq(3, 3, 5, 4) },
      },
      buttons: { a: "punch", b: "arc", c: "punchfire" },
      moves: {
        punch: { anim: "punch", damage: 8, hitstun: 18, blockstun: 12, push: 3.4, chip: 1, sfx: "whoosh" },
        arc:   { anim: "arc", proj: { anim: "firearc", speed: 1.6, damage: 12, y: -20, burn: true, once: true, sfx: "fire", boom: "burst", dx: 50 } },
        punchfire: { anim: "punchfire", proj: { anim: "fireball", speed: 3.6, damage: 12, y: -44, burn: true, sfx: "fire", boom: "burst" } },
      },
      impact: "burst",
    },
  };

  window.CHARS = CHARS;
  window.ROSTER = ["gaby", "alicia", "adriano", "rogerio", "barba"];
})();
