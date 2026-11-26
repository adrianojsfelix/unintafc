// Som do UFS Fighter — tudo sintetizado na hora com Web Audio (estilo chip de 16 bits).
// Música de combate original, impactos, defesa, fogo, explosão, miado e voz de dor.
// O navegador só libera áudio depois de uma tecla/toque: Sound.unlock() faz isso.
(() => {
  "use strict";
  let ac = null, master, musicBus, sfxBus, noiseBuf, muted = false, musicOn = false;

  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    // compressor leve para os golpes não estourarem por cima da música
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = 0.32; musicBus.connect(comp);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // ---------- blocos básicos ----------
  const env = (g, t, a, peak, dec, end = 0.0001) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(end, t + a + dec);
  };
  function tone(type, freq, t, dur, vol, out, glideTo) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, vol, out, filter = "lowpass", f1 = 2000, f2 = null, q = 1) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = filter; f.Q.value = q; f.frequency.setValueAtTime(f1, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.003, vol, dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }

  // ---------- voz (vogal "a" com formantes) ----------
  // pitch = altura da voz; o P2 usa um tom um pouco diferente para distinguir
  function voice(t, dur, f0, f1, vol, vowel = [800, 1150, 2900]) {
    const src = ac.createOscillator(); src.type = "sawtooth";
    src.frequency.setValueAtTime(f0, t);
    src.frequency.exponentialRampToValueAtTime(f1, t + dur);
    // vibrato curto, dá vida ao grito
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 7; lg.gain.value = f0 * 0.03; lfo.connect(lg); lg.connect(src.frequency);
    const out = ac.createGain(); env(out, t, 0.015, vol, dur);
    vowel.forEach((fr, i) => {
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fr; bp.Q.value = 9 + i * 3;
      const g = ac.createGain(); g.gain.value = [1, 0.6, 0.25][i];
      src.connect(bp); bp.connect(g); g.connect(out);
    });
    // sopro (ar) por baixo da voz
    noise(t, dur * 0.8, vol * 0.25, out, "bandpass", 1800, 1200, 2);
    out.connect(sfxBus);
    src.start(t); lfo.start(t); src.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }

  const SFX = {
    whoosh() { noise(ac.currentTime, 0.14, 0.35, sfxBus, "bandpass", 700, 3000, 3); },
    hit() {
      const t = ac.currentTime;
      tone("sine", 160, t, 0.16, 0.9, sfxBus, 45);              // pancada grave
      noise(t, 0.09, 0.8, sfxBus, "lowpass", 3500, 400);         // estalo
      tone("square", 90, t, 0.06, 0.25, sfxBus, 60);
    },
    block() {
      const t = ac.currentTime;
      noise(t, 0.05, 0.5, sfxBus, "highpass", 2500);
      tone("square", 520, t, 0.07, 0.2, sfxBus, 380);
    },
    fire() {
      const t = ac.currentTime;
      noise(t, 0.5, 0.55, sfxBus, "bandpass", 400, 2400, 1.5);
      tone("sawtooth", 110, t, 0.35, 0.2, sfxBus, 220);
    },
    boom() {
      const t = ac.currentTime;
      noise(t, 0.7, 0.9, sfxBus, "lowpass", 1800, 120);
      tone("sine", 90, t, 0.5, 0.8, sfxBus, 30);
    },
    whip() {
      const t = ac.currentTime;
      noise(t, 0.12, 0.3, sfxBus, "bandpass", 900, 4000, 2);
      noise(t + 0.11, 0.05, 0.9, sfxBus, "highpass", 3000);   // estalo
      tone("square", 1800, t + 0.11, 0.03, 0.2, sfxBus, 900);
    },
    energy() {
      const t = ac.currentTime;
      tone("sawtooth", 220, t, 0.4, 0.25, sfxBus, 880);
      tone("square", 440, t, 0.35, 0.12, sfxBus, 1320);
      noise(t, 0.3, 0.25, sfxBus, "bandpass", 3000, 1200, 4);
    },
    shutter() {                                   // clique de câmera (foto do Angelo)
      const t = ac.currentTime;
      noise(t, 0.03, 0.7, sfxBus, "highpass", 4000);
      noise(t + 0.06, 0.04, 0.6, sfxBus, "highpass", 3000);
      tone("sine", 2400, t + 0.02, 0.12, 0.15, sfxBus, 1200);
    },
    crazy() {                                     // grito do Barba no modo maluco
      const t = ac.currentTime;
      tone("sawtooth", 140, t, 0.5, 0.3, sfxBus, 420);
      noise(t, 0.4, 0.4, sfxBus, "bandpass", 600, 2600, 2);
    },
    blip() { tone("square", 880, ac.currentTime, 0.05, 0.15, sfxBus); },
    select() {
      const t = ac.currentTime;
      tone("square", 660, t, 0.08, 0.18, sfxBus); tone("square", 990, t + 0.07, 0.14, 0.18, sfxBus);
    },
    meow() {
      const t = ac.currentTime;
      voice(t, 0.38, 700, 520, 0.55, [600, 1700, 3300]);
    },
    pain(pitch = 1) {
      const t = ac.currentTime, v = 0.85 + Math.random() * 0.3;
      voice(t, 0.22 + Math.random() * 0.08, 440 * pitch * v, 300 * pitch * v, 0.7);
    },
    ko(pitch = 1) {
      const t = ac.currentTime;
      voice(t, 0.9, 520 * pitch, 190 * pitch, 0.8, [750, 1200, 2800]);
    },
    fight() {
      const t = ac.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => tone("square", f, t + i * 0.07, 0.18, 0.18, sfxBus));
    },
    win() {
      const t = ac.currentTime;
      [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone("square", f, t + i * 0.11, 0.2, 0.16, sfxBus));
    },
  };

  // ---------- música de combate (composição original, Lá menor, 152 bpm) ----------
  const BPM = 152, STEP = 60 / BPM / 4;             // semicolcheia
  const N = n => 440 * Math.pow(2, (n - 69) / 12);  // número MIDI -> Hz
  // progressão: Am – F – G – Em  (2 compassos cada no laço de 8 compassos)
  const ROOTS = [45, 45, 41, 41, 43, 43, 40, 40];
  const BASS = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 10, 12, 7, 12];
  // melodia: 8 compassos x 16 passos; null = pausa
  const MEL = [
    [69, null, 72, null, 76, null, 74, 72, 74, null, 72, 69, 71, null, 72, null],
    [69, null, null, null, 64, null, 67, null, 69, null, 72, null, 71, 69, 67, null],
    [65, null, 69, null, 72, null, 74, 72, 76, null, 74, 72, 74, null, 77, null],
    [76, null, null, 74, 72, null, 69, null, 72, null, 74, null, 76, null, null, null],
    [67, null, 71, null, 74, null, 79, 77, 76, null, 74, 72, 74, null, 71, null],
    [74, null, null, 76, 77, null, 76, 74, 79, null, 77, null, 76, null, 74, null],
    [76, null, 79, null, 83, null, 81, 79, 76, null, 79, null, 74, 76, 71, null],
    [72, 74, 76, null, 79, null, 76, null, 81, null, null, 79, 76, null, null, null],
  ];
  let nextT = 0, step = 0, timer = null;

  function scheduleStep(t, s) {
    const bar = Math.floor(s / 16) % 8, i = s % 16, root = ROOTS[bar];
    // baixo (triângulo)
    if (i % 2 === 0 || BASS[i] === 12) tone("triangle", N(root + BASS[i]), t, STEP * 1.6, 0.55, musicBus);
    // melodia (quadrada, com eco)
    const m = MEL[bar][i];
    if (m) {
      tone("square", N(m), t, STEP * 1.8, 0.16, musicBus);
      tone("square", N(m), t + STEP * 3, STEP * 1.2, 0.05, musicBus);
    }
    // acordes em arpejo bem baixinho
    const triad = root === 45 || root === 40 ? [0, 3, 7] : [0, 4, 7];   // Am/Em menores, F/G maiores
    if (i % 4 === 2) triad.forEach((iv, k) => tone("square", N(root + 24 + iv), t + k * 0.02, STEP, 0.035, musicBus));
    // bateria
    if (i === 0 || i === 8 || i === 10) tone("sine", 140, t, 0.14, 0.9, musicBus, 40);      // bumbo
    if (i === 4 || i === 12) noise(t, 0.13, 0.5, musicBus, "bandpass", 1800, 900, 0.8);     // caixa
    if (i % 2 === 1) noise(t, 0.03, 0.12, musicBus, "highpass", 7000);                    // chimbal
    if (bar === 7 && i >= 12) noise(t, 0.08, 0.35, musicBus, "bandpass", 1200 + i * 120, null, 1); // virada
  }
  function scheduler() {
    while (nextT < ac.currentTime + 0.12) { scheduleStep(nextT, step++); nextT += STEP; }
  }
  function startMusic() {
    if (musicOn || !ac) return;
    musicOn = true; step = 0; nextT = ac.currentTime + 0.05;
    timer = setInterval(scheduler, 25);
  }

  window.Sound = {
    unlock() {
      init();
      if (ac.state === "suspended") ac.resume();
      startMusic();
    },
    play(name, ...args) { if (ac && !muted && ac.state === "running") SFX[name](...args); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ac.currentTime, 0.02);
      return muted;
    },
    get muted() { return muted; },
    get ready() { return !!ac; },
  };
})();
