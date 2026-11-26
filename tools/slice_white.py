"""Fatia folhas de sprites desenhadas sobre fundo liso, sem caixas (ex.: Alicia).

Fundo: branco/claro (padrão) ou chroma key magenta (#FF00FF) / verde (#00FF00) com --bg.

Cada personagem/efeito vira um quadro; partículas soltas (faíscas, brasas) são
anexadas ao quadro grande mais próximo. Linhas = animações, ordenadas da esquerda p/ direita.

Uso: python3 tools/slice_white.py assets/reference/alicia_sprites_raw.jpg alicia
     python3 tools/slice_white.py assets/reference/angelo_sprites_raw.png angelo --bg magenta
Se o personagem não estiver em REGIONS, as faixas e o nº de quadros são detectados sozinhos
(e impressos, para você copiar para REGIONS e ajustar se algum quadro sair errado).
"""
import argparse
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from slice_sheet import build_atlas  # noqa: E402


ROOT = Path(__file__).resolve().parent.parent
BIG = 700          # área mínima (px) de um quadro "de verdade"
ATTACH = 30        # distância máx. para anexar partícula solta a um quadro


# Faixas (y0, y1, nº de quadros[, cortes x manuais]) de cada folha, lidas do layout.
REGIONS = {
    "adriano": [(43, 299, 7), (328, 555, 7), (577, 824, 4), (850, 1081, 5), (1107, 1336, 5, [192, 412, 695, 885]),
                (1348, 1472, 5, [290, 560, 855, 1015]),
                (1472, 1710, 5), (1713, 1984, 8)],
    "rogerio": [(41, 300, 8), (318, 572, 6), (588, 851, 8), (852, 1041, 10), (1057, 1325, 7), (1345, 1538, 8),
                (1571, 1648, 5), (1649, 1826, 7), (1826, 2000, 8)],
    "angelo":  [(18, 168, 5), (185, 342, 7), (347, 523, 6), (522, 673, 2), (673, 827, 6), (829, 991, 6),
                (1010, 1138, 4), (1156, 1315, 9), (1341, 1445, 2), (1444, 1613, 7), (1619, 1795, 3), (1800, 1994, 7)],
    "kaisson": [(20, 156, 5), (171, 317, 7), (327, 478, 6), (486, 623, 2), (634, 789, 7), (804, 965, 7), (992, 1088, 6),
                (1111, 1260, 6), (1272, 1422, 3), (1437, 1573, 6), (1586, 1769, 3), (1784, 1989, 7)],
    "barba":   [(45, 264, 8), (274, 479, 9), (525, 730, 9), (771, 974, 8), (999, 1138, 12), (1159, 1340, 7),
                (1380, 1536, 7), (1536, 1749, 3), (1756, 1989, 8)],
    "alicia":  [(13, 227, 6), (249, 430, 8), (455, 625, 2), (625, 789, 3), (813, 984, 5), (1020, 1134, 3),
                (1174, 1343, 4), (1363, 1535, 7), (1555, 1770, 2), (1770, 1990, 6)],
    "gaby":    [(19, 201, 7), (214, 364, 6), (369, 529, 6), (542, 673, 2), (686, 844, 4), (862, 1026, 9), (1049, 1213, 5),
                (1241, 1407, 6), (1428, 1589, 7), (1615, 1770, 2), (1794, 1986, 8)],
}


# Retângulos (x0, y0, x1, y1) apagados antes de fatiar: títulos que a IA escreveu na folha.
ERASE = {
    "kaisson": [(0, 0, 205, 2000)],
    "alicia": [(225, 1766, 390, 1770)],    # separa a 2ª pose de vitória do fogo do K.O. logo abaixo
    "barba": [(0, 0, 325, 36), (0, 272, 200, 306), (1262, 270, 1455, 306), (0, 484, 180, 518), (828, 484, 892, 518),
              (0, 734, 282, 768), (0, 972, 292, 1006), (0, 1138, 342, 1172), (0, 1340, 242, 1376),
              (0, 1536, 162, 1570), (0, 1750, 160, 1782)],
}

# A IA às vezes desenha uma linha da folha maior ou menor que as outras: aqui vai a altura (px na folha)
# de uma pessoa em pé naquela linha. "ref" = altura em pé de referência; linhas fora da lista usam "ref".
# Cada linha é escalada para a pessoa em pé ficar com 112 px no jogo.
ROW_H = {
    "gaby":    {"ref": 178, 1: 150, 2: 150, 3: 150, 4: 162, 5: 165, 6: 165, 7: 165, 8: 165, 9: 186, 10: 186},
    "barba":   {"ref": 210, 1: 172, 5: 182, 6: 182},
    "angelo":  {"ref": 152, 10: 172, 11: 185},
    "kaisson": {"ref": 148, 3: 133, 10: 179, 11: 201},
    "alicia":  {"ref": 210, 2: 190, 3: 190, 4: 190, 5: 190, 6: 190, 7: 190, 9: 217},
}

# linha usada como referência de altura (a pose de luta); padrão = linha 0
SCALE_ROW = {"angelo": 1, "kaisson": 1, "barba": 0, "alicia": 0, "gaby": 0}


def best_cuts(occ, n, minw):
    """Escolhe n-1 colunas de corte com a menor ocupação somada (quadros podem se encostar)."""
    c = np.cumsum(occ) / occ.sum()          # ignora poeira solta nas pontas
    lo, hi = int(np.searchsorted(c, 0.002)), int(np.searchsorted(c, 0.998)) + 1
    o = np.convolve(occ.astype(float), np.ones(5) / 5, mode="same")
    W = hi - lo
    INF = 1e18
    cost = np.full((n, W), INF); back = np.zeros((n, W), int)
    for x in range(minw, W):
        cost[1 % n if n > 1 else 0][x] = o[lo + x]
    for k in range(2, n):
        run, arg = INF, 0
        for x in range(W):
            j = x - minw
            if j >= 0 and cost[k - 1][j] < run:
                run, arg = cost[k - 1][j], j
            if run < INF:
                cost[k][x] = run + o[lo + x]; back[k][x] = arg
    if n == 1:
        return lo, hi, []
    last = [x for x in range(W - minw) if cost[n - 1][x] < INF]
    x = min(last, key=lambda v: cost[n - 1][v])
    cuts = [x]
    for k in range(n - 1, 1, -1):
        x = back[k][x]; cuts.append(x)
    return lo, hi, sorted(lo + c for c in cuts)


def chroma_bg(a, key):
    """Fundo magenta ou verde, incluindo a borda borrada pelo JPEG/antisserrilhado."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if key == "magenta":
        score = np.minimum(r, b) - g
    else:
        score = g - np.maximum(r, b)
    bg = score > 90
    lab, _ = ndimage.label(bg)
    big = np.bincount(lab.ravel())
    big[0] = 0
    bg = np.isin(lab, np.nonzero(big > 12)[0])   # ignora pontinhos isolados da cor dentro do desenho
    # cresce para tons mais escuros da mesma cor ligados ao fundo (sombra roxa sob os pés, borda do JPEG)
    bg = ndimage.binary_propagation(bg, mask=bg | (score > 35))
    return bg


def despill(a, bg, key):
    """Tira o reflexo da cor do fundo que sobra no contorno do desenho."""
    ring = ndimage.binary_dilation(bg, iterations=3) & ~bg
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if key == "magenta":
        excess = np.clip(np.minimum(r, b) - g, 0, None)
        a[..., 0] = np.where(ring, r - excess // 2, r)
        a[..., 2] = np.where(ring, b - excess // 2, b)
    else:
        excess = np.clip(g - np.maximum(r, b), 0, None)
        a[..., 1] = np.where(ring, g - excess, g)


def frame_spans(band):
    """Faixas horizontais [xa, xb] dos quadros de uma linha (pedaços sobrepostos = mesmo quadro)."""
    lab, n = ndimage.label(ndimage.binary_dilation(band, iterations=3))
    spans = sorted((sl[1].start, sl[1].stop) for k, sl in enumerate(ndimage.find_objects(lab), 1)
                   if sl is not None and (band[sl] & (lab[sl] == k)).sum() >= BIG)
    merged = []
    for xa, xb in spans:
        if merged and merged[-1][1] - xa > 0.4 * min(xb - xa, merged[-1][1] - merged[-1][0]):
            merged[-1][1] = max(merged[-1][1], xb)
        else:
            merged.append([xa, xb])
    return merged


def auto_regions(fg, gap=3):
    """Faixas = blocos de linhas separados por >= gap linhas vazias; quadros = pedaços grandes."""
    rows = ndimage.binary_opening(fg, iterations=2).sum(axis=1) > 2
    regs, y, H = [], 0, len(rows)
    while y < H:
        if not rows[y]:
            y += 1
            continue
        y0 = y
        while y < H and (rows[y:y + gap].any()):
            y += 1
        merged = frame_spans(fg[y0:y])
        if merged and y - y0 > 30:
            regs.append((max(0, y0 - 2), min(H, y + 2), len(merged)))
    return regs


def main(src, name, key="white"):
    a = np.asarray(Image.open(src).convert("RGB")).astype(int)
    if key != "white":
        bg = chroma_bg(a, key)
        for x0, y0, x1, y1 in ERASE.get(name, []):
            bg[y0:y1, x0:x1] = True
        despill(a, bg, key)
        fg = ndimage.binary_opening(~bg, iterations=1)
        return slice_fg(a, fg, name, smart=True)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mn = np.minimum(np.minimum(r, g), b)
    # fundo: branco azulado (o miolo do fogo é branco amarelado, b bem menor que r)
    bg = (mn > 222) & (b >= r - 6)
    # sombra sob os pés: cinza-azulado claro, removido só quando encosta no fundo
    # (assim a calça clara do Barba, que tem contorno, fica)
    cand = (mn > 160) & (b >= r + 4) & (np.abs(r - g) < 18)
    lab, n = ndimage.label(cand | bg)
    touching = np.unique(lab[bg])
    bg = np.isin(lab, touching[touching > 0])
    # auréola clara que o JPEG deixa em volta do fogo
    for _ in range(2):
        bg |= (mn > 200) & ndimage.binary_dilation(bg) & ~(b < r - 60)
    # fundo "fechado" (sem ligação com a borda): se a moldura em volta é quente, é o miolo
    # branco do fogo e volta a ser desenho; se não (laço do chicote, vão entre braços), segue fundo
    lab, n = ndimage.label(bg)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        if k in border or sl is None:
            continue
        hole = lab[sl] == k
        ring = ndimage.binary_dilation(hole, iterations=2) & ~hole
        px = a[sl][ring]
        if len(px) and (px[:, 0] - px[:, 2]).mean() > 60:
            bg[sl][hole] = False
    fg = ndimage.binary_opening(~bg, iterations=1)
    return slice_fg(a, fg, name)


def slice_fg(a, fg, name, smart=False):
    if name not in REGIONS:
        REGIONS[name] = auto_regions(fg)
        print("faixas detectadas (copie para REGIONS se quiser ajustar):")
        print(f'    "{name}": {REGIONS[name]},')
    # cada pedaço pertence à faixa onde está o seu centro (punho erguido não invade a linha de cima)
    flab, fn_ = ndimage.label(fg)
    centers = ndimage.center_of_mass(fg, flab, range(1, fn_ + 1))
    owner_band = np.zeros(fn_ + 1, int) - 1
    for k, (cy, _) in enumerate(centers, 1):
        for bi, reg in enumerate(REGIONS[name]):
            if reg[0] <= cy < reg[1]:
                owner_band[k] = bi

    out = ROOT / "assets/sprites" / name / "frames"
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.png"):
        f.unlink()
    meta = []
    for ri, reg in enumerate(REGIONS[name]):
        y0, y1, count = reg[:3]
        mine = owner_band[flab] == ri
        rows_ = np.nonzero(mine.any(axis=1))[0]
        y0, y1 = int(rows_.min()), int(rows_.max()) + 1
        band = mine[y0:y1]
        occ = band.sum(axis=0)
        lo, hi, cuts = best_cuts(occ, count, max(20, int((occ > 0).sum() / count * 0.6)))
        spans = frame_spans(band) if smart else []
        if len(spans) == count:                 # quadros bem separados: corta no meio de cada vão
            cuts = [(spans[i][1] + spans[i + 1][0]) // 2 for i in range(count - 1)]
            lo, hi = spans[0][0], spans[-1][1]
        if len(reg) > 3:
            cuts = reg[3]
        # cada pedaço conectado vai inteiro para o quadro do seu centro (o punho esticado
        # não fica no quadro vizinho); só pedaços enormes, de quadros grudados, são fatiados
        edges = [0] + list(cuts) + [band.shape[1]]
        segw = (hi - lo) / count
        seg_masks = [np.zeros_like(band) for _ in range(count)]
        blab, bn = ndimage.label(ndimage.binary_dilation(band, iterations=1))
        blab[~band] = 0
        for k, sl in enumerate(ndimage.find_objects(blab), 1):
            if sl is None:
                continue
            comp = blab[sl] == k
            if sl[1].stop - sl[1].start > 1.3 * segw:
                for si in range(count):
                    xa, xb = max(edges[si], sl[1].start), min(edges[si + 1], sl[1].stop)
                    if xa < xb:
                        seg_masks[si][sl[0], xa:xb] |= comp[:, xa - sl[1].start:xb - sl[1].start]
            else:
                cx = sl[1].start + np.nonzero(comp)[1].mean()
                si = min(count - 1, max(0, int(np.searchsorted(edges, cx, side="right")) - 1))
                seg_masks[si][sl] |= comp
        frames = []
        for fi in range(count):
            full = seg_masks[fi]
            xs_all = np.nonzero(full.any(axis=0))[0]
            if len(xs_all) == 0:
                continue
            xa, xb = int(xs_all.min()), int(xs_all.max()) + 1
            m = full[:, xa:xb]
            ys, xs = np.nonzero(m)
            if len(ys) == 0:
                continue
            fy0, fy1, fx0, fx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            mm = m[fy0:fy1, fx0:fx1]
            crop = a[y0 + fy0:y0 + fy1, xa + fx0:xa + fx1]
            img = Image.fromarray(np.dstack([crop.astype(np.uint8), np.where(mm, 255, 0).astype(np.uint8)]), "RGBA")
            fn = f"r{ri:02d}_f{fi:02d}.png"
            img.save(out / fn)
            frames.append({"file": fn, "src": [int(xa + fx0), int(y0 + fy0), int(fx1 - fx0), int(fy1 - fy0)]})
        meta.append({"row": ri, "frames": frames})
        print(ri, len(frames), end="  ")
    print()
    (out / "frames.json").write_text(json.dumps(meta, indent=1))
    # escala: a pose parada fica com ~112 px de altura, como a Gaby
    hs = sorted(f_["src"][3] for f_ in meta[SCALE_ROW.get(name, 0)]["frames"])
    scale = round(112 / hs[len(hs) // 2], 3)
    if name in ROW_H:
        rh = ROW_H[name]
        scale = {None: round(112 / rh["ref"], 4), **{r: round(112 / h, 4) for r, h in rh.items() if r != "ref"}}
    print("escala", scale)
    build_atlas(out, ROOT / "assets/sprites" / name, scale)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("name")
    ap.add_argument("--bg", choices=["white", "magenta", "green"], default="white")
    args = ap.parse_args()
    main(args.src, args.name, args.bg)
