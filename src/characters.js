// Elenco do UNINTA FIGHTERS: animações e golpes de cada personagem.
// Quadros: "rLL_fQQ" = linha LL, quadro QQ da folha de sprites do personagem
// (veja assets/sprites/<id>/frames e as tabelas no README).
//
// Quadro de animação: [id, duração em ticks (1/60 s), marca]
//   marca "hit"   = quadro ativo do golpe (área de ataque calculada pelo desenho)
//   marca "hit2"  = novo acerto dentro do mesmo golpe (sequências)
//   marca "spawn" = solta o projétil do golpe
// flip: o desenho original olha para a esquerda e precisa ser espelhado.
// hitSfx: som ao acertar (padrão: "kickhit" em chutes, "punchhit" no resto). Golpes corpo a corpo tiram sangue.
// dash: o golpe avança o lutador (velocidade em px/tick). hover: flutua (px acima do chão) parado/andando.
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
        idle:  { loop: true, frames: [[f(0, 0), 12], [f(0, 1), 12], [f(0, 2), 12], [f(0, 1), 12]] },
        walk:  { loop: true, frames: seq(1, 0, 5, 6) },
        back:  { loop: true, frames: seq(1, 5, 0, 7) },
        jump:  { frames: [[f(2, 1), 6], [f(2, 2), 8], [f(2, 3), 10], ...hold(2, 4, 60)] },
        guard: { loop: true, frames: hold(3, 0, 60) },
        // chute alto: ela luta principalmente com as pernas
        kick:  { frames: [[f(4, 0), 4], [f(4, 1), 4, "hit"], [f(4, 2), 7, "hit"], [f(4, 0), 6]] },
        fire:  { frames: [[f(5, 0), 5], [f(5, 2), 5], [f(5, 4), 5, "spawn"], [f(5, 6), 8], [f(5, 8), 8]] },
        cat:   { frames: [[f(7, 0), 8], [f(7, 2), 6, "spawn"], [f(7, 2), 14]] },
        hit:   { frames: [[f(8, 2), 7], [f(8, 3), 12]] },
        fall:  { frames: [[f(8, 3), 8], [f(8, 4), 10], [f(8, 5), 14], ...hold(8, 6)] },
        burn:  { frames: [[f(10, 3), 8], [f(10, 1), 10], [f(10, 2), 12], ...hold(10, 7)] },
        win:   { loop: true, frames: [[f(9, 0), 16], [f(9, 1), 16]] },
        fireball: { loop: true, frames: [[f(6, 1), 5], [f(6, 2), 5]] },
        catrun:   { loop: true, frames: [[f(7, 3), 5], [f(7, 4), 5], [f(8, 0), 5], [f(7, 5), 5]] },
        boom:     { frames: [[f(6, 3), 4], [f(6, 4), 10]] },
      },
      buttons: { a: "kick", b: "fire", c: "cat" },
      moves: {
        kick:  { anim: "kick", damage: 8, hitstun: 18, blockstun: 12, push: 3.2, chip: 1, sfx: "kickswing" },
        fire:  { anim: "fire", proj: { anim: "fireball", speed: 3.4, damage: 12, y: -50, burn: true, sfx: "fire" } },
        cat:   { anim: "cat", proj: { anim: "catrun", speed: 2.6, damage: 10, y: 0, sfx: "meow" } },
      },
      impact: "boom",
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
        kick:  { anim: "kick", damage: 10, hitstun: 22, blockstun: 14, push: 4, chip: 1, sfx: "kickswing" },
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
      name: "BARBA", fullName: "Barba", voice: 0.5, color: "#1fc7a0",
      walkSpeed: 2.0, backSpeed: 1.4, jumpV: -6.4,
      anims: {
        idle:  { loop: true, frames: [[f(0, 0), 14], [f(0, 1), 14]] },
        walk:  { loop: true, frames: seq(0, 2, 7, 6) },
        back:  { loop: true, frames: seq(0, 7, 2, 7) },
        jump:  { frames: [[f(1, 2), 6], [f(1, 3), 10], ...hold(1, 4, 60)] },
        guard: { loop: true, frames: hold(1, 8, 60) },
        punch: { frames: [[f(2, 0), 3], [f(2, 2), 6, "hit"], [f(2, 3), 5], [f(2, 0), 5]] },
        // poder do ChatGPT: invoca o símbolo da IA e dispara
        beam:  { frames: [[f(3, 0), 6], [f(3, 2), 6], [f(3, 4), 6, "spawn"], [f(3, 6), 12]] },
        // modo maluco: rasga a camisa e sai socando
        crazy: { frames: [[f(5, 0), 5], [f(5, 1), 5], [f(5, 2), 5], [f(5, 3), 6], [f(5, 6), 12],
                          [f(5, 4), 5, "hit"], [f(5, 5), 5, "hit2"], [f(6, 0), 5, "hit3"], [f(6, 1), 8], [f(0, 0), 4]] },
        hit:   { frames: [[f(6, 2), 7], [f(6, 3), 12]] },
        fall:  { frames: [[f(6, 2), 8], [f(6, 3), 8], [f(6, 4), 10], [f(6, 5), 12], ...hold(6, 6)] },
        burn:  { frames: [[f(8, 2), 6], [f(8, 0), 8], [f(8, 1), 8], [f(8, 5), 10], [f(8, 6), 12], ...hold(8, 7)] },
        win:   { loop: true, frames: [[f(7, 0), 14], [f(7, 1), 14], [f(7, 2), 14], [f(7, 1), 14]] },
        aiorb: { loop: true, frames: [[f(4, 2), 5], [f(4, 4), 5], [f(4, 6), 5], [f(4, 8), 5]] },
        aiboom: { frames: [[f(4, 10), 5], [f(4, 11), 6]] },
      },
      buttons: { a: "punch", b: "beam", c: "crazy" },
      moves: {
        punch: { anim: "punch", damage: 8, hitstun: 18, blockstun: 12, push: 3.4, chip: 1, sfx: "whoosh" },
        beam:  { anim: "beam", proj: { anim: "aiorb", speed: 3.2, damage: 12, y: -43, sfx: "ai", boom: "aiboom" } },
        crazy: { anim: "crazy", damage: 6, hitstun: 16, blockstun: 10, push: 1.4, chip: 1, sfx: "crazy" },
      },
      impact: "aiboom",
    },

    angelo: {
      name: "ANGELO", fullName: "Angelo", voice: 0.58, color: "#e8b04a",
      walkSpeed: 1.9, backSpeed: 1.4, jumpV: -6.3,
      anims: {
        idle:  { loop: true, frames: [[f(5, 3), 16], [f(5, 2), 16]] },
        walk:  { loop: true, frames: seq(1, 0, 6, 5) },
        back:  { loop: true, frames: seq(1, 6, 0, 6) },
        jump:  { frames: [[f(2, 1), 6], [f(2, 2), 10], ...hold(2, 3, 60)] },
        guard: { loop: true, frames: hold(3, 1, 60) },
        punch: { frames: [[f(4, 2), 3], [f(4, 0), 6, "hit"], [f(4, 1), 5], [f(5, 3), 4]] },
        // tira foto com o celular: o flash vira projétil
        photo: { frames: [[f(5, 2), 6], [f(5, 3), 6], [f(5, 4), 6, "spawn"], [f(5, 5), 10]] },
        // queixão: o queixo cresce e ele acerta com ele
        chin:  { frames: [[f(7, 3), 5], [f(7, 0), 6], [f(7, 1), 6], [f(7, 2), 5], [f(7, 4), 9, "hit"],
                          [f(7, 5), 5], [f(7, 6), 6], [f(7, 8), 5]] },
        hit:   { frames: [[f(9, 0), 7], [f(9, 1), 12]] },
        fall:  { frames: [[f(9, 2), 8], [f(9, 3), 10], [f(9, 4), 12], [f(9, 5), 12], ...hold(9, 6)] },
        burn:  { frames: [[f(11, 0), 6], [f(11, 2), 8], [f(11, 3), 8], [f(11, 4), 10], [f(11, 5), 12], ...hold(11, 6)] },
        win:   { loop: true, frames: [[f(10, 0), 14], [f(10, 1), 14], [f(10, 2), 20]] },
        flash: { loop: true, frames: [[f(6, 0), 4], [f(6, 1), 4]] },
        flashboom: { frames: [[f(6, 2), 4], [f(6, 3), 6]] },
      },
      buttons: { a: "punch", b: "photo", c: "chin" },
      moves: {
        punch: { anim: "punch", damage: 7, hitstun: 18, blockstun: 12, push: 3, chip: 1, sfx: "whoosh" },
        photo: { anim: "photo", proj: { anim: "flash", speed: 4.2, damage: 11, y: -42, sfx: "shutter", boom: "flashboom" } },
        chin:  { anim: "chin", damage: 15, hitstun: 26, blockstun: 16, push: 5, chip: 2, sfx: "boing", hitSfx: "kickhit" },
      },
      impact: "flashboom",
    },

    kaisson: {
      name: "KAISSON", fullName: "Kaisson", voice: 0.66, color: "#e0892c",
      walkSpeed: 2.1, backSpeed: 1.5, jumpV: -6.5,
      anims: {
        idle:  { loop: true, frames: [[f(4, 3), 12], [f(4, 4), 12]] },
        walk:  { loop: true, frames: seq(1, 0, 6, 5) },
        back:  { loop: true, frames: seq(1, 6, 0, 6) },
        jump:  { frames: [[f(2, 1), 6], [f(2, 2), 10], ...hold(2, 3, 60)] },
        guard: { loop: true, frames: hold(3, 1, 60) },
        punch: { frames: [[f(4, 4), 3], [f(4, 0), 6, "hit"], [f(4, 1), 5], [f(4, 3), 4]] },
        // tira do bolso um pão longo e atira feito arma
        bread: { frames: [[f(5, 0), 8], [f(5, 1), 6, "spawn"], [f(5, 1), 10], [f(5, 4), 8]] },
        // usa a baguete como taco
        bat:   { frames: [[f(7, 0), 5], [f(7, 1), 4], [f(7, 2), 5, "hit"], [f(7, 3), 8], [f(4, 3), 5]] },
        hit:   { frames: [[f(9, 0), 7], [f(9, 1), 12]] },
        fall:  { frames: [[f(9, 1), 8], [f(9, 2), 10], [f(9, 3), 12], [f(9, 4), 12], ...hold(9, 5)] },
        burn:  { frames: [[f(11, 2), 6], [f(11, 0), 10], [f(11, 1), 12], [f(11, 5), 12], ...hold(11, 6)] },
        win:   { loop: true, frames: [[f(10, 0), 20], [f(10, 1), 12], [f(10, 2), 12]] },
        loaf:  { loop: true, frames: seq(6, 0, 3, 4) },
        crumbs: { frames: [[f(6, 4), 5], [f(6, 5), 6]] },
      },
      buttons: { a: "punch", b: "bread", c: "bat" },
      moves: {
        punch: { anim: "punch", damage: 7, hitstun: 18, blockstun: 12, push: 3, chip: 1, sfx: "whoosh" },
        bread: { anim: "bread", proj: { anim: "loaf", speed: 4.6, damage: 10, y: -54, sfx: "pop", boom: "crumbs" } },
        bat:   { anim: "bat", damage: 13, hitstun: 24, blockstun: 14, push: 4.5, chip: 2, sfx: "whoosh", hitSfx: "kickhit" },
      },
      impact: "crumbs",
    },

    alicia: {
      name: "ALICIA", fullName: "Alicia de Moraes", voice: 1.12, color: "#7a3cc8",
      walkSpeed: 1.8, backSpeed: 1.4, jumpV: -6.6, hover: 8,
      anims: {
        idle:  { loop: true, frames: seq(1, 0, 7, 7) },
        walk:  { loop: true, frames: seq(1, 0, 7, 5) },
        back:  { loop: true, frames: seq(1, 7, 0, 6) },
        jump:  { frames: hold(2, 0, 60) },
        guard: { loop: true, frames: hold(3, 1, 60) },
        // chicotada curta
        punch: { frames: [[f(0, 4), 4], [f(3, 0), 7, "hit"], [f(0, 5), 6]] },
        // chicotada longa
        whip:  { frames: [[f(4, 1), 5], [f(4, 2), 4], [f(4, 4), 4], [f(4, 0), 8, "hit"], [f(4, 3), 7]] },
        // voa para a frente envolta em energia sombria
        dash:  { frames: [[f(3, 2), 6], [f(5, 0), 6, "hit"], [f(5, 1), 6, "hit"], [f(5, 2), 6, "hit"], [f(5, 1), 6, "hit"], [f(2, 1), 8]] },
        hit:   { frames: [[f(7, 0), 7], [f(7, 1), 12]] },
        fall:  { frames: [[f(7, 1), 8], [f(7, 2), 8], [f(7, 3), 10], [f(7, 4), 12], [f(7, 5), 12], ...hold(7, 6)] },
        burn:  { frames: [[f(9, 0), 8], [f(9, 1), 10], [f(9, 2), 8], [f(9, 3), 8], [f(9, 4), 10], ...hold(9, 5)] },
        win:   { loop: true, frames: [[f(8, 0), 16], [f(8, 1), 16]] },
        boom:  { frames: hold(6, 3, 12) },
      },
      buttons: { a: "punch", b: "whip", c: "dash" },
      moves: {
        punch: { anim: "punch", damage: 6, hitstun: 16, blockstun: 10, push: 2.6, chip: 1, sfx: "whip" },
        whip:  { anim: "whip", damage: 11, hitstun: 22, blockstun: 14, push: 4, chip: 2, sfx: "whip" },
        dash:  { anim: "dash", damage: 13, hitstun: 26, blockstun: 14, push: 5, chip: 2, sfx: "dash", dash: 3.6, hitSfx: "kickhit" },
      },
      impact: "boom",
    },
  };

  window.CHARS = CHARS;
  window.ROSTER = ["gaby", "adriano", "rogerio", "barba", "angelo", "kaisson", "alicia"];
})();
