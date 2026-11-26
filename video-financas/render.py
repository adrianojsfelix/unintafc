# -*- coding: utf-8 -*-
"""Renderiza o vídeo (motion graphics) a partir de conteudo.py.

Uso:  python3 render.py            -> saida/video.mp4 (+ legendas.srt)
      python3 render.py --preview  -> só alguns quadros PNG em saida/preview/
"""
import math, os, sys, subprocess, textwrap
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

import conteudo as C

W, H, FPS = 1920, 1080, 30
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "saida")

# ---------- paleta ----------
BG1 = (12, 24, 40); BG2 = (22, 42, 66)
CARD = (24, 42, 64); CARD2 = (33, 56, 84)
TXT = (246, 241, 232); MUTED = (160, 178, 198)
OURO = (242, 181, 68); LARANJA = (232, 116, 59)
VERDE = (63, 179, 127); VERMELHO = (229, 72, 77); AZUL = (92, 140, 196)

FD = "/usr/share/fonts/opentype/inter/"
_fc = {}
def F(size, peso="Bold", display=True):
    size = max(1, int(size)); k = (size, peso, display)
    if k not in _fc:
        nome = ("InterDisplay-" if display else "Inter-") + peso + ".otf"
        _fc[k] = ImageFont.truetype(FD + nome, size)
    return _fc[k]

# ---------- easing / tempo ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_io(x): x = clamp(x); return 3 * x * x - 2 * x * x * x
def back_out(x):
    x = clamp(x); c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def prog(t, ini, dur=0.6): return clamp((t - ini) / dur)

def a(cor, alfa): return (cor[0], cor[1], cor[2], int(255 * clamp(alfa)))

def brl(v, dec=0):
    s = f"{v:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "R$ " + s

# ---------- fundo ----------
def fundo_base(c1=BG1, c2=BG2):
    y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
    r = np.sqrt((x - 0.75) ** 2 + (y - 0.2) ** 2)
    m = clamp_np(1 - r * 1.3)
    img = np.zeros((H, W, 3), np.float32)
    for i in range(3):
        img[..., i] = c1[i] + (c2[i] - c1[i]) * m
    # grão sutil
    rng = np.random.default_rng(7)
    img += rng.normal(0, 2.0, (H, W, 1))
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

def clamp_np(a_): return np.clip(a_, 0, 1)

_bg = {}
def fundo(nome="padrao"):
    if nome not in _bg:
        if nome == "padrao":
            _bg[nome] = fundo_base()
        elif nome == "sertao":
            _bg[nome] = sertao()
        elif nome == "cidade":
            _bg[nome] = cidade()
    return _bg[nome].copy()

def sertao():
    y = np.linspace(0, 1, H)[:, None, None]
    topo = np.array([40, 30, 70], np.float32); meio = np.array([232, 116, 59], np.float32)
    base = np.array([250, 196, 110], np.float32)
    ceu = np.where(y < 0.6, topo + (meio - topo) * (y / 0.6), meio + (base - meio) * ((y - 0.6) / 0.4))
    img = Image.fromarray(np.broadcast_to(ceu, (H, W, 3)).astype(np.uint8))
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((1250, 330, 1550, 630), fill=(255, 214, 120, 255))
    d.ellipse((1200, 280, 1600, 680), fill=(255, 214, 120, 40))
    # morros
    for cor, amp, base_y, fase in [((120, 60, 50), 60, 760, 0.3), ((80, 40, 40), 80, 840, 1.7), ((45, 26, 30), 50, 930, 2.9)]:
        pts = [(0, H)]
        for x in range(0, W + 40, 40):
            pts.append((x, base_y - amp * math.sin(x / 260 + fase) - 20 * math.sin(x / 90 + fase)))
        pts.append((W, H)); d.polygon(pts, fill=cor)
    # mandacaru
    def cacto(x, y, s, cor=(30, 18, 22)):
        d.rounded_rectangle((x, y - 220 * s, x + 34 * s, y), 17 * s, fill=cor)
        d.rounded_rectangle((x - 60 * s, y - 150 * s, x - 34 * s, y - 70 * s), 13 * s, fill=cor)
        d.rounded_rectangle((x - 60 * s, y - 90 * s, x + 10 * s, y - 66 * s), 12 * s, fill=cor)
        d.rounded_rectangle((x + 60 * s, y - 180 * s, x + 86 * s, y - 100 * s), 13 * s, fill=cor)
        d.rounded_rectangle((x + 20 * s, y - 124 * s, x + 86 * s, y - 100 * s), 12 * s, fill=cor)
    cacto(250, 990, 1.3); cacto(1650, 1000, 0.9); cacto(1100, 960, 0.6)
    return img

def cidade():
    img = fundo_base((10, 18, 34), (30, 44, 80))
    d = ImageDraw.Draw(img, "RGBA")
    rng = np.random.default_rng(3)
    x = 0
    while x < W:
        w = int(rng.integers(70, 160)); h = int(rng.integers(180, 520))
        d.rectangle((x, H - h, x + w - 6, H), fill=(18, 30, 52, 255))
        for jy in range(H - h + 20, H - 20, 34):
            for jx in range(x + 12, x + w - 20, 26):
                if rng.random() < 0.35:
                    d.rectangle((jx, jy, jx + 10, jy + 14), fill=(242, 181, 68, 120))
        x += w
    return img

# ---------- componentes ----------
def texto(d, xy, s, f, cor=TXT, alfa=1.0, anchor="mm", dy=0.0):
    if alfa <= 0: return
    d.text((xy[0], xy[1] + dy), s, font=f, fill=a(cor, alfa), anchor=anchor)

def entra(d, xy, s, f, t, ini, cor=TXT, anchor="mm", dur=0.6, sai=None):
    p = ease_out(prog(t, ini, dur))
    al = p
    if sai is not None:
        al *= 1 - ease_io(prog(t, sai, 0.4))
    texto(d, xy, s, f, cor, al, anchor, dy=(1 - p) * 40)

def card(d, box, alfa=1.0, cor=CARD, raio=28, borda=None):
    d.rounded_rectangle(box, raio, fill=a(cor, alfa * 0.92),
                        outline=a(borda, alfa) if borda else None, width=3 if borda else 0)

def selo_canal(d, t):
    d.ellipse((60, 52, 92, 84), fill=a(OURO, 1))
    texto(d, (106, 68), C.CANAL.upper(), F(24, "Bold"), MUTED, 0.9, "lm")

def capitulo(d, nome):
    f = F(24, "SemiBold")
    w = d.textlength(nome, font=f)
    card(d, (W - 90 - w, 46, W - 50, 92), 0.8, CARD, 22)
    texto(d, (W - 70, 69), nome, f, TXT, 0.95, "rm")

def legenda(d, frase):
    if not frase: return
    f = F(38, "SemiBold", False)
    linhas = textwrap.wrap(frase, 64)
    lh = 50; hh = lh * len(linhas) + 28
    wmax = max(d.textlength(l, font=f) for l in linhas)
    y0 = H - 50 - hh
    d.rounded_rectangle((W / 2 - wmax / 2 - 30, y0, W / 2 + wmax / 2 + 30, y0 + hh), 18, fill=(0, 0, 0, 185))
    for i, l in enumerate(linhas):
        texto(d, (W / 2, y0 + 14 + lh * i + lh / 2), l, f, TXT, 1.0)

def check(d, cx, cy, p, cor=VERDE, r=26):
    if p <= 0: return
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=a(cor, p))
    pts = [(cx - 11, cy + 1), (cx - 3, cy + 10), (cx + 13, cy - 9)]
    k = ease_out(p)
    if k > 0.3: d.line(pts, fill=a(TXT, p), width=6, joint="curve")

# ---------- legendas: quebra a narração em frases curtas ----------
def frases(narr, ini, dur):
    if not narr: return []
    ws = narr.split(); blocos = []; atual = []
    for w in ws:
        atual.append(w)
        fim = w[-1] in ".!?,:" and len(atual) >= 5
        if len(atual) >= 11 or (fim and len(atual) >= 6) or w[-1] in ".!?" and len(atual) >= 3:
            blocos.append(" ".join(atual)); atual = []
    if atual: blocos.append(" ".join(atual))
    total = sum(len(b.split()) for b in blocos)
    util = dur - 1.0
    t = ini + 0.5; out = []
    for b in blocos:
        dd = util * len(b.split()) / total
        out.append((t, t + dd, b)); t += dd
    return out

# =================== CENAS ===================
def cena_gancho(d, t, D, c):
    cartoes = [
        ("Ganha pouco?", OURO, None),
        ("Deve até a alma?", LARANJA, None),
        ("Eu já fui LISO", TXT, "de dar dó."),
        ("Nome sujo · 3 cartões", VERMELHO, "e salário mínimo"),
        ("Hoje: vivo de", TXT, "investimentos"),
        ("Não foi sorte.", OURO, "Foi um plano."),
        ("6 passos + PDF grátis", VERDE, "com números de 2026"),
    ]
    n = len(cartoes); seg = (D - 0.5) / n
    i = min(int(t / seg), n - 1); tl = t - i * seg
    s1, cor, s2 = cartoes[i]
    p = back_out(prog(tl, 0, 0.5)); sai = 1 - ease_io(prog(tl, seg - 0.35, 0.35)) if i < n - 1 else 1
    al = clamp(prog(tl, 0, 0.25)) * sai
    f = F(int(130 * (0.85 + 0.15 * p)), "Black")
    texto(d, (W / 2, 430 if s2 else 480), s1, f, cor, al)
    if s2: texto(d, (W / 2, 590), s2, F(80, "Bold"), TXT, al * ease_out(prog(tl, 0.2)))
    # barra de pulso
    w = 600 * ease_out(prog(tl, 0, 0.6))
    d.rounded_rectangle((W / 2 - w / 2, 700, W / 2 + w / 2, 708), 4, fill=a(cor, al * 0.8))

def cena_vinheta(d, t, D, c):
    p = ease_out(prog(t, 0, 1.0))
    cy = 470 + (1 - p) * 200
    r = 120 * back_out(prog(t, 0, 0.8))
    d.ellipse((W / 2 - r, cy - r, W / 2 + r, cy + r), fill=a(OURO, 1))
    d.ellipse((W / 2 - r * 0.7, cy - r * 0.7, W / 2 + r * 0.7, cy + r * 0.7), outline=a(BG1, 0.5), width=6)
    texto(d, (W / 2, cy), "R$", F(int(max(r, 1) * 0.8), "Black"), BG1, p)
    entra(d, (W / 2, 700), C.CANAL, F(96, "Black"), t, 0.6)
    entra(d, (W / 2, 790), "finanças de gente simples, com dado de verdade", F(38, "Medium"), t, 1.0, MUTED)

def cena_historia(d, t, D, c, img):
    etapas = [
        (0.00, "Interior do Ceará", "onde dinheiro é coisa que some"),
        (0.13, "Mãe vendendo tapioca", "na porta de casa"),
        (0.24, "19 anos: Fortaleza", "atendente · 1 salário mínimo"),
        (0.38, "1º cartão de crédito", "\"rapaz, eu me achei rico!\""),
        (0.48, "2º, 3º cartão + crediário", ""),
        (0.58, "24 anos: devendo", None),
        (0.78, "O problema não era só eu.", "era a matemática contra mim"),
    ]
    k = t / D
    i = max(j for j, e in enumerate(etapas) if e[0] <= k)
    ini = etapas[i][0] * D; fim = (etapas[i + 1][0] * D) if i + 1 < len(etapas) else D + 1
    tl = t - ini
    sai = 1 - ease_io(prog(t, fim - 0.4, 0.4))
    # fundo: sertão -> cidade
    mix = ease_io(prog(k, 0.2, 0.08))
    if mix > 0:
        img.paste(Image.blend(fundo("sertao"), fundo("cidade"), mix))
    d2 = ImageDraw.Draw(img, "RGBA")
    d2.rectangle((0, 0, W, H), fill=(0, 0, 0, 70))
    card(d2, (160, 260, 1100, 640), 0.85 * sai * ease_out(prog(tl, 0, 0.4)), (12, 20, 34), 32)
    titulo, sub = etapas[i][1], etapas[i][2]
    al = ease_out(prog(tl, 0, 0.5)) * sai
    texto(d2, (220, 380), titulo, F(70, "Black"), OURO if i in (0, 6) else TXT, al, "lm", (1 - al) * 30)
    if sub is None:
        v = 11000 * ease_out(prog(tl, 0.3, 2.5))
        texto(d2, (220, 520), brl(v), F(110, "Black"), VERMELHO, al, "lm")
        texto(d2, (220, 610), "≈ 7 salários mínimos de hoje", F(34, "Medium"), MUTED, al * ease_out(prog(tl, 2.5)), "lm")
    elif sub:
        texto(d2, (220, 480), sub, F(44, "Medium"), MUTED, al * ease_out(prog(tl, 0.25)), "lm")
    # linha do tempo
    for j in range(len(etapas)):
        x = 220 + j * 120; on = j <= i
        d2.ellipse((x - 9, 760 - 9, x + 9, 760 + 9), fill=a(OURO if on else MUTED, 1 if on else 0.4))
        if j < len(etapas) - 1:
            d2.line((x + 12, 760, x + 108, 760), fill=a(MUTED, 0.35), width=3)
    return d2

def cena_dados(d, t, D, c):
    texto(d, (W / 2, 175), "Tu não tá sozinho", F(64, "Black"), TXT, ease_out(prog(t, 0)))
    passo = D / 4.2
    tiles = [
        (0.6, "Pessoas com conta atrasada", lambda p: f"{84.2 * p:.1f}".replace(".", ",") + " mi", "Serasa · recorde em 2026", VERMELHO),
        (passo, "Famílias com alguma dívida", lambda p: f"{81.6 * p:.1f}".replace(".", ",") + "%", "CNC/Peic · out/2026", LARANJA),
        (passo * 2, "Inadimplentes que ganham até 1 salário mínimo", lambda p: f"{48 * p:.0f}%", "Serasa · 2026", OURO),
        (passo * 3, "Salário mínimo em 2026", lambda p: brl(1621 * p), "Decreto 12.797/2025", AZUL),
    ]
    xs = [120, 555, 990, 1425]
    for (ini, rot, val, fonte, cor), x in zip(tiles, xs):
        p = ease_out(prog(t, ini, 0.7))
        if p <= 0: continue
        y = 290 + (1 - p) * 60
        card(d, (x, y, x + 375, y + 470), p, CARD, 28)
        d.rounded_rectangle((x + 30, y + 34, x + 90, y + 42), 4, fill=a(cor, p))
        texto(d, (x + 30, y + 160), val(ease_out(prog(t, ini, 1.8))), F(78, "Black"), TXT, p, "lm")
        for k, ln in enumerate(textwrap.wrap(rot, 20)):
            texto(d, (x + 30, y + 250 + k * 40), ln, F(32, "SemiBold", False), TXT, p * 0.95, "lm")
        texto(d, (x + 30, y + 430), fonte, F(22, "Medium", False), MUTED, p, "lm")
        if rot.startswith("Famílias"):  # pictograma 10 casas, 8 marcadas
            # 8 em cada 10 famílias
            for q in range(10):
                bx = x + 30 + q * 32
                on = q < 8 and ease_out(prog(t, ini + 0.8 + q * 0.08, 0.3)) > 0.5
                d.rounded_rectangle((bx, y + 360, bx + 26, y + 392), 5, fill=a(cor if on else MUTED, p * (1 if on else 0.3)))
    if t > passo * 3.4:
        p = ease_out(prog(t, passo * 3.4, 0.7))
        texto(d, (W / 2, 830), "Dívida não é falta de vergonha na cara. É matemática contra o trabalhador.",
              F(36, "SemiBold", False), OURO, p)

def cena_juros(d, t, D, c):
    texto(d, (130, 170), "O vilão: juros do rotativo", F(60, "Black"), TXT, ease_out(prog(t, 0)), "lm")
    # números grandes à direita
    p1 = ease_out(prog(t, 0.08 * D, 0.7))
    card(d, (1290, 250, 1800, 470), p1, CARD)
    texto(d, (1330, 320), "442% ao ano", F(70, "Black"), VERMELHO, p1, "lm")
    texto(d, (1330, 400), "≈ 15% ao mês · BC, jun/2026", F(30, "Medium", False), MUTED, p1, "lm")
    p2 = ease_out(prog(t, 0.28 * D, 0.7))
    card(d, (1290, 500, 1800, 690), p2, CARD)
    texto(d, (1330, 560), "Poupança", F(44, "Black"), AZUL, p2, "lm")
    texto(d, (1330, 630), "< 1% ao mês", F(34, "Medium", False), MUTED, p2, "lm")
    p3 = ease_out(prog(t, 0.45 * D, 0.7))
    card(d, (1290, 720, 1800, 900), p3, CARD, borda=OURO)
    texto(d, (1330, 775), "Lei 14.690/2023", F(40, "Black"), OURO, p3, "lm")
    texto(d, (1330, 840), "juros ≤ 100% da dívida", F(32, "Medium", False), TXT, p3, "lm")
    # gráfico: R$ 1.000 no rotativo, 12 meses
    x0, y0, x1, y1 = 160, 790, 1180, 300
    vmax = 5500
    def px(m): return x0 + (x1 - x0) * m / 12
    def py(v): return y0 - (y0 - y1) * v / vmax
    pg = ease_out(prog(t, 0.05 * D, 0.5))
    for v in (0, 1000, 2000, 3000, 4000, 5000):
        d.line((x0, py(v), x1, py(v)), fill=a(MUTED, 0.15 * pg), width=1)
        texto(d, (x0 - 16, py(v)), f"{v // 1000} mil" if v else "0", F(22, "Medium", False), MUTED, pg, "rm")
    for m in (0, 3, 6, 9, 12):
        texto(d, (px(m), y0 + 30), f"mês {m}", F(22, "Medium", False), MUTED, pg)
    texto(d, (x0, y1 - 50), "R$ 1.000 deixados no rotativo", F(28, "SemiBold", False), TXT, pg, "lm")
    taxa = 5.424 ** (1 / 12)
    k = ease_io(prog(t, 0.12 * D, 0.25 * D)) * 12
    def serie(f, cor, larg, al, tracej=False):
        pts = [(px(m / 4), py(f(m / 4))) for m in range(0, int(k * 4) + 1)]
        if len(pts) > 1:
            if tracej:
                for j in range(0, len(pts) - 1, 2):
                    d.line(pts[j:j + 2], fill=a(cor, al), width=larg)
            else:
                d.line(pts, fill=a(cor, al), width=larg, joint="curve")
        return pts[-1] if pts else None
    fim_sem = serie(lambda m: 1000 * taxa ** m, MUTED, 3, 0.7, True)
    fim_pou = serie(lambda m: 1000 * 1.0067 ** m, AZUL, 4, 1)
    pl = ease_io(prog(t, 0.45 * D, 0.6))
    fim_lei = serie(lambda m: min(1000 * taxa ** m, 2000), OURO, 5, pl) if pl > 0 else None
    if k >= 12:
        texto(d, (px(12) - 10, py(5424) - 26), "sem a lei: R$ 5.424", F(26, "Bold", False), MUTED, 1, "rm")
        texto(d, (px(12) - 10, py(1083) + 30), "poupança: ≈ R$ 1.083", F(26, "Bold", False), AZUL, 1, "rm")
        if pl > 0:
            texto(d, (px(12) - 10, py(2000) - 28), "com a lei: até R$ 2.000", F(28, "Black", False), OURO, pl, "rm")
    if t > 0.82 * D:
        p = ease_out(prog(t, 0.82 * D))
        card(d, (160, 850, 1180, 910), p, VERMELHO, 20)
        texto(d, (670, 880), "Pagar o mínimo do cartão NÃO é pagar.", F(34, "Black", False), TXT, p)

def cena_passo(d, t, D, c):
    n = c["passo"]
    p = back_out(prog(t, 0, 0.6))
    r = 110 * p
    d.ellipse((300 - r, 400 - r, 300 + r, 400 + r), fill=a(OURO, 1))
    texto(d, (300, 380), str(n), F(int(max(r, 1) * 1.2), "Black"), BG1, clamp(p))
    texto(d, (300, 560), "PASSO", F(40, "Black"), OURO, ease_out(prog(t, 0.2)))
    entra(d, (500, 330), c["passo_titulo"], F(88, "Black"), t, 0.3, TXT, "lm")
    itens = c["itens"]
    for j, it in enumerate(itens):
        ini = 0.15 * D + j * 0.22 * D
        pe = ease_out(prog(t, ini, 0.6))
        if pe <= 0: continue
        y = 470 + j * 130
        card(d, (500, y, 1760, y + 100), pe, CARD, 24)
        check(d, 560, y + 50, ease_out(prog(t, ini + 0.4, 0.4)))
        texto(d, (610, y + 50), it, F(42, "SemiBold", False), TXT, pe, "lm", (1 - pe) * 20)

def cena_orcamento(d, t, D, c):
    texto(d, (130, 170), "Orçamento de quem ganha R$ 1.621", F(60, "Black"), TXT, ease_out(prog(t, 0)), "lm")
    texto(d, (130, 230), "exemplo ilustrativo · a planilha em branco tá no PDF", F(28, "Medium", False), MUTED, ease_out(prog(t, 0.3)), "lm")
    linhas = [("Moradia", 450, AZUL), ("Comida", 500, AZUL), ("Luz e água", 150, AZUL),
              ("Transporte", 140, AZUL), ("Celular", 60, AZUL), ("Dívidas", 300, LARANJA), ("Cofrinho", 21, VERDE)]
    x0 = 470; xmax = 1350; esc = (xmax - x0) / 500
    soma = 0
    for j, (nome, v, cor) in enumerate(linhas):
        ini = 0.22 * D + j * 0.055 * D if j < 5 else 0.5 * D + (j - 5) * 0.08 * D
        pe = ease_out(prog(t, ini, 0.8))
        if pe <= 0: continue
        y = 285 + j * 74
        texto(d, (x0 - 30, y + 26), nome, F(36, "SemiBold", False), TXT, pe, "rm")
        w = max(8, v * esc * pe)
        d.rounded_rectangle((x0, y + 4, x0 + w, y + 48), 6, fill=a(cor, 1))
        texto(d, (x0 + w + 20, y + 26), brl(v * pe), F(34, "Bold", False), TXT, pe, "lm")
        soma += v * pe
    # painel lateral
    pp = ease_out(prog(t, 0.4 * D, 0.6))
    card(d, (1500, 310, 1810, 700), pp, CARD)
    texto(d, (1530, 360), "Essenciais", F(28, "SemiBold", False), MUTED, pp, "lm")
    texto(d, (1530, 410), "R$ 1.300", F(54, "Black"), TXT, pp, "lm")
    texto(d, (1530, 490), "Sobra", F(28, "SemiBold", False), MUTED, pp, "lm")
    texto(d, (1530, 540), "R$ 321", F(54, "Black"), OURO, pp, "lm")
    texto(d, (1530, 620), "300 dívida · 21 cofre", F(26, "Medium", False), MUTED, pp, "lm")
    if t > 0.75 * D:
        p = ease_out(prog(t, 0.75 * D))
        card(d, (130, 815, 1810, 875), p, CARD2, 20, OURO)
        texto(d, (970, 845), "Lei do Superendividamento (14.181/2021): nenhum acordo pode te deixar sem o mínimo pra viver",
              F(30, "SemiBold", False), TXT, p)

def cena_ordem(d, t, D, c):
    texto(d, (W / 2, 160), "Qual dívida pagar primeiro?", F(60, "Black"), TXT, ease_out(prog(t, 0)))
    pe = ease_out(prog(t, 0.05 * D, 0.6)) * (1 - 0.6 * ease_io(prog(t, 0.25 * D, 0.5)))
    card(d, (360, 220, 1560, 300), pe, CARD2, 24, VERDE)
    texto(d, (W / 2, 260), "1º as que tiram teu chão: aluguel · água · luz · pensão", F(34, "Bold", False), TXT, pe)
    dividas = [("Cartão (acordo)", 3200, "15% a.m."), ("Crediário da loja", 900, "6% a.m."),
               ("Empréstimo pessoal", 1800, "5% a.m."), ("Conta de celular", 280, "2% a.m.")]
    jur = {"Cartão (acordo)": 15, "Crediário da loja": 6, "Empréstimo pessoal": 5, "Conta de celular": 2}
    cols = [("AVALANCHE", "maior juros primeiro · economiza mais", sorted(dividas, key=lambda x: -jur[x[0]]), 0.3, LARANJA, 160),
            ("BOLA DE NEVE", "menor dívida primeiro · dá ânimo", sorted(dividas, key=lambda x: x[1]), 0.58, AZUL, 1000)]
    for nome, sub, lst, ini, cor, x in cols:
        pc = ease_out(prog(t, ini * D, 0.6))
        if pc <= 0: continue
        texto(d, (x, 360), nome, F(46, "Black"), cor, pc, "lm")
        texto(d, (x, 410), sub, F(26, "Medium", False), MUTED, pc, "lm")
        for j, (dn, v, jr) in enumerate(lst):
            pj = ease_out(prog(t, ini * D + 0.4 + j * 0.25, 0.5))
            y = 450 + j * 100
            primeiro = j == 0
            card(d, (x, y, x + 760, y + 84), pj, CARD2 if primeiro else CARD, 18, cor if primeiro else None)
            texto(d, (x + 30, y + 42), f"{j + 1}. {dn}", F(32, "SemiBold", False), TXT, pj, "lm")
            texto(d, (x + 730, y + 42), f"{brl(v)} · {jr}", F(30, "Bold", False), cor if primeiro else MUTED, pj, "rm")
    if t > 0.85 * D:
        p = ease_out(prog(t, 0.85 * D))
        texto(d, (W / 2, 870), "O melhor método é o que tu consegue manter.", F(40, "Black"), OURO, p)

def cena_negocia(d, t, D, c):
    texto(d, (W / 2, 160), "Negocia sem cair em golpe", F(60, "Black"), TXT, ease_out(prog(t, 0)))
    pe = ease_out(prog(t, 0.15 * D, 0.6))
    card(d, (130, 240, 930, 800), pe, CARD, 28, VERDE)
    texto(d, (180, 300), "Canais oficiais", F(44, "Black"), VERDE, pe, "lm")
    canais = ["App ou agência do teu banco", "Serasa Limpa Nome", "consumidor.gov.br", "Procon da tua cidade", "Defensoria Pública"]
    for j, cn in enumerate(canais):
        pj = ease_out(prog(t, 0.2 * D + j * 0.04 * D, 0.5))
        y = 390 + j * 82
        check(d, 200, y, pj, VERDE, 22)
        texto(d, (245, y), cn, F(36, "SemiBold", False), TXT, pj, "lm")
    pg = ease_out(prog(t, 0.5 * D, 0.6))
    tremor = math.sin(t * 40) * 6 * (1 - prog(t, 0.5 * D + 0.6, 0.6)) if pg > 0 else 0
    card(d, (1000 + tremor, 240, 1790 + tremor, 560), pg, (70, 22, 30), 28, VERMELHO)
    texto(d, (1050 + tremor, 300), "É GOLPE se…", F(44, "Black"), VERMELHO, pg, "lm")
    for j, g in enumerate(["pedem PIX adiantado", "\"limpo teu nome em 24h\"", "link estranho no WhatsApp"]):
        texto(d, (1050 + tremor, 380 + j * 60), "✕  " + g, F(34, "SemiBold", False), TXT, pg, "lm")
    pr = ease_out(prog(t, 0.72 * D, 0.6))
    card(d, (1000, 600, 1790, 800), pr, CARD2, 28, OURO)
    texto(d, (1050, 655), "Regra de ouro do acordo", F(36, "Black"), OURO, pr, "lm")
    texto(d, (1050, 715), "parcela ≤ o que sobra no Passo 3", F(34, "SemiBold", False), TXT, pr, "lm")
    texto(d, (1050, 765), "(no exemplo: até R$ 300/mês)", F(28, "Medium", False), MUTED, pr, "lm")

def cena_cofrinho(d, t, D, c):
    texto(d, (W / 2, 160), "O primeiro cofrinho", F(60, "Black"), TXT, ease_out(prog(t, 0)))
    # pote
    x0, y0, x1, y1 = 260, 330, 700, 880
    nivel = ease_io(prog(t, 0.15 * D, 0.4 * D))
    d.rounded_rectangle((x0, y0, x1, y1), 50, outline=a(TXT, 0.85), width=6)
    d.rounded_rectangle((x0 + 60, y0 - 40, x1 - 60, y0 + 6), 14, fill=a(MUTED, 0.9))
    topo = y1 - 12 - (y1 - y0 - 30) * nivel
    if nivel > 0.01:
        d.rounded_rectangle((x0 + 12, topo, x1 - 12, y1 - 12), 40, fill=a(VERDE, 0.9))
    mes = int(round(12 * nivel))
    texto(d, ((x0 + x1) / 2, 600), brl(21 * 12 * nivel), F(64, "Black"), TXT, 1)
    texto(d, ((x0 + x1) / 2, 670), f"mês {mes} de 12", F(30, "Medium", False), TXT, 0.9)
    p1 = ease_out(prog(t, 0.2 * D, 0.6))
    texto(d, (860, 380), "R$ 21 por mês", F(56, "Black"), VERDE, p1, "lm")
    texto(d, (860, 440), "= R$ 252 em um ano", F(40, "SemiBold", False), TXT, p1, "lm")
    for j, s in enumerate(["o conserto da moto", "o remédio", "não voltar pro cartão"]):
        pj = ease_out(prog(t, 0.45 * D + j * 0.06 * D, 0.5))
        texto(d, (880, 530 + j * 60), "• " + s, F(38, "SemiBold", False), MUTED, pj, "lm")
    pv = ease_out(prog(t, 0.72 * D, 0.7))
    card(d, (860, 740, 1780, 900), pv, CARD2, 28, OURO)
    texto(d, (900, 790), "Quitou a última dívida?", F(36, "SemiBold", False), MUTED, pv, "lm")
    texto(d, (900, 850), "R$ 321/mês passam a ser TEUS", F(50, "Black"), OURO, pv, "lm")

def cena_fechamento(d, t, D, c):
    entra(d, (W / 2, 220), "2 anos e meio pra sair do vermelho", F(64, "Black"), t, 0.2)
    entra(d, (W / 2, 300), "não foi rápido, não foi bonito, mas foi.", F(40, "Medium"), t, 0.6, MUTED)
    # mockup do PDF
    pp = ease_out(prog(t, 0.25 * D, 0.7))
    if pp > 0:
        ox = 460; oy = 400 + (1 - pp) * 60
        d.rounded_rectangle((ox + 14, oy + 14, ox + 334, oy + 444), 16, fill=a((0, 0, 0), 0.35 * pp))
        d.rounded_rectangle((ox, oy, ox + 320, oy + 430), 16, fill=a(TXT, pp))
        d.rectangle((ox, oy, ox + 320, oy + 120), fill=a(LARANJA, pp))
        texto(d, (ox + 160, oy + 60), "SAINDO DO", F(30, "Black"), TXT, pp)
        texto(d, (ox + 160, oy + 95), "VERMELHO", F(30, "Black"), TXT, pp)
        for j in range(7):
            d.rounded_rectangle((ox + 30, oy + 160 + j * 36, ox + 290 - (j % 3) * 50, oy + 176 + j * 36), 6, fill=a(MUTED, pp))
        d.rounded_rectangle((ox + 220, oy + 380, ox + 300, oy + 414), 10, fill=a(VERMELHO, pp))
        texto(d, (ox + 260, oy + 397), "PDF", F(22, "Black"), TXT, pp)
        texto(d, (880, 500), "Baixa o PDF grátis", F(60, "Black"), OURO, pp, "lm")
        texto(d, (880, 570), "link na descrição ↓", F(40, "SemiBold", False), TXT, pp, "lm")
        texto(d, (880, 640), "imprime · preenche a lápis · começa hoje", F(32, "Medium", False), MUTED, pp, "lm")
    pb = back_out(prog(t, 0.55 * D, 0.6))
    if pb > 0:
        cx, cy = 1130, 760; w = 420 * pb; h = 90 * pb
        clicado = t > 0.7 * D
        d.rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), 45, fill=a(MUTED if clicado else VERMELHO, 1))
        texto(d, (cx, cy), "INSCRITO ✓" if clicado else "INSCREVA-SE", F(int(40 * clamp(pb)) + 1, "Black"), TXT, clamp(pb))

DESENHO = {
    "gancho": cena_gancho, "vinheta": cena_vinheta, "dados": cena_dados, "juros": cena_juros,
    "passo": cena_passo, "orcamento": cena_orcamento, "ordem": cena_ordem, "negocia": cena_negocia,
    "cofrinho": cena_cofrinho, "fechamento": cena_fechamento,
}

def quadro(c, t, D, frase):
    if c["visual"] == "historia":
        img = fundo("sertao")
        d = ImageDraw.Draw(img, "RGBA")
        d = cena_historia(d, t, D, c, img)
    else:
        img = fundo("padrao")
        d = ImageDraw.Draw(img, "RGBA")
        DESENHO[c["visual"]](d, t, D, c)
    if c["visual"] != "vinheta":
        selo_canal(d, t)
        if c["visual"] not in ("gancho",):
            capitulo(d, c["titulo"])
    legenda(d, frase)
    # fade de entrada/saída
    f = min(prog(t, 0, 0.35), 1 - prog(t, D - 0.3, 0.3))
    if f < 1:
        img = Image.blend(Image.new("RGB", (W, H), BG1), img, clamp(f))
    return img

def render_cena(args):
    idx, ini, D = args
    c = C.CENAS[idx]
    fr = frases(c["narracao"], 0, D)
    path = os.path.join(SAIDA, "partes", f"{idx:02d}.mp4")
    n = int(round(D * FPS))
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                          "-crf", "20", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for k in range(n):
        t = k / FPS
        frase = next((s for a_, b_, s in fr if a_ <= t < b_), "")
        p.stdin.write(quadro(c, t, D, frase).tobytes())
    p.stdin.close(); p.wait()
    return path

def srt():
    tl, _ = C.linha_do_tempo()
    def ts(x):
        h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
        return f"{h:02d}:{m:02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
    out = []; n = 1
    for c, ini, D in tl:
        for a_, b_, s in frases(c["narracao"], ini, D):
            out.append(f"{n}\n{ts(a_)} --> {ts(b_)}\n{s}\n"); n += 1
    open(os.path.join(SAIDA, "legendas.srt"), "w", encoding="utf-8").write("\n".join(out))

if __name__ == "__main__":
    os.makedirs(os.path.join(SAIDA, "partes"), exist_ok=True)
    tl, total = C.linha_do_tempo()
    if "--preview" in sys.argv:
        os.makedirs(os.path.join(SAIDA, "preview"), exist_ok=True)
        for i, (c, ini, D) in enumerate(tl):
            fr = frases(c["narracao"], 0, D)
            for q in (0.35, 0.92):
                t = D * q
                frase = next((s for a_, b_, s in fr if a_ <= t < b_), "")
                quadro(c, t, D, frase).save(os.path.join(SAIDA, "preview", f"{i:02d}_{c['id']}_{int(q*100)}.png"))
        sys.exit()
    srt()
    jobs = sorted([(i, ini, D) for i, (c, ini, D) in enumerate(tl)], key=lambda j: -j[2])
    with Pool(4) as pool:
        partes = pool.map(render_cena, jobs)
    lista = os.path.join(SAIDA, "partes", "lista.txt")
    open(lista, "w").write("".join(f"file '{i:02d}.mp4'\n" for i in range(len(tl))))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lista,
                    "-c", "copy", os.path.join(SAIDA, "so_video.mp4")], check=True)
    print("ok", total)
