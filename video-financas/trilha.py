# -*- coding: utf-8 -*-
"""Gera a trilha original (sintetizada, sem direitos autorais de terceiros):
lo-fi com levada de baião bem leve + whoosh nas trocas de cena + moeda na vinheta.
Saída: saida/trilha.wav (volume baixo, pronta pra ficar por baixo da narração)."""
import os, wave
import numpy as np
import conteudo as C

SR = 44100
AQUI = os.path.dirname(os.path.abspath(__file__))
tl, TOTAL = C.linha_do_tempo()
N = int((TOTAL + 1) * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(1)

BPM = 84; BEAT = 60 / BPM; BAR = BEAT * 4
def hz(m): return 440 * 2 ** ((m - 69) / 12)

# Am9 - Fmaj7 - Cmaj7 - G6 (2 compassos cada)
ACORDES = [[57, 60, 64, 67, 71], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
BAIXO = [45, 41, 48, 43]

def add(buf, ini, sig, g=1.0):
    i = int(ini * SR); j = min(N, i + len(sig))
    if i >= N: return
    buf[i:j] += sig[: j - i] * g

def tom(f, dur, harm=(1, .35, .12), att=.02, rel=.4):
    t = np.arange(int(dur * SR)) / SR
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * t + k) for k, a in enumerate(harm))
    env = np.minimum(1, t / att) * np.exp(-t / (dur * rel + 1e-3))
    return s * env

def pad(f, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.003 * t) + .2 * np.sin(2 * np.pi * f * 2 * t)
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.0)
    return s * np.clip(env, 0, 1)

def zabumba(dur=.35, f0=95):
    t = np.arange(int(dur * SR)) / SR
    f = f0 * (1 + 1.5 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)

def chimbal(dur=.06):
    t = np.arange(int(dur * SR)) / SR
    n = rng.normal(0, 1, len(t)); n = np.diff(n, prepend=0)
    return n * np.exp(-t * 60)

inicio_musica = tl[1][1]  # música entra forte na vinheta; antes, só pad
t = 0.0; k = 0
while t < TOTAL:
    ci = (k // 2) % 4
    if k % 2 == 0:
        for m in ACORDES[ci]:
            s = pad(hz(m), BAR * 2)
            add(L, t, s, .045); add(R, t + .012, s, .045)
    if t >= inicio_musica - 0.01:
        # baixo + zabumba no baião (1, "e-a" do 1, 2) a cada meio compasso
        for meio in (0, 2 * BEAT):
            b = t + meio
            add(L, b, tom(hz(BAIXO[ci]), BEAT * 1.4, (1, .25), .01, .5), .16)
            add(R, b, tom(hz(BAIXO[ci]), BEAT * 1.4, (1, .25), .01, .5), .16)
            for off, g in ((0, .22), (BEAT * .75, .14), (BEAT, .18)):
                z = zabumba(); add(L, b + off, z, g); add(R, b + off, z, g)
        for e in range(8):  # chimbal/triângulo leve
            g = .05 if e % 2 else .028
            h = chimbal(); add(L, t + e * BEAT / 2, h, g * .8); add(R, t + e * BEAT / 2 + .004, h, g)
        # arpejo dedilhado
        notas = ACORDES[ci]
        for e in range(8):
            m = notas[(e * 2 + k) % len(notas)] + 12
            if rng.random() < .75:
                s = tom(hz(m), .9, (1, .2, .05), .005, .25)
                pan = .5 + .35 * np.sin(e)
                add(L, t + e * BEAT / 2, s, .05 * (1 - pan)); add(R, t + e * BEAT / 2, s, .05 * pan)
    t += BAR; k += 1

# whoosh nas trocas de cena
for c, ini, d in tl[1:]:
    dur = .7; n = int(dur * SR); tt = np.arange(n) / SR
    ruido = rng.normal(0, 1, n)
    ruido = np.convolve(ruido, np.ones(18) / 18, mode="same")
    env = np.sin(np.pi * tt / dur) ** 2
    add(L, ini - .35, ruido * env, .25); add(R, ini - .33, ruido * env, .25)

# moeda na vinheta
vi = tl[1][1] + .15
for f, g in ((2637, .18), (3520, .12)):
    s = tom(f, 1.2, (1, .3, .1), .002, .3); add(L, vi, s, g); add(R, vi, s, g)
    vi += .09

# fade in/out e normalização baixa (pico -12 dBFS) pra ficar de cama
env = np.ones(N); fi = int(2 * SR); fo = int(4 * SR)
env[:fi] = np.linspace(0, 1, fi); env[-fo:] = np.linspace(1, 0, fo)
L *= env; R *= env
pk = max(np.abs(L).max(), np.abs(R).max())
L = L / pk * .25; R = R / pk * .25
st = (np.stack([L, R], 1) * 32767).astype(np.int16)
os.makedirs(os.path.join(AQUI, "saida"), exist_ok=True)
with wave.open(os.path.join(AQUI, "saida", "trilha.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print("trilha ok", TOTAL)
