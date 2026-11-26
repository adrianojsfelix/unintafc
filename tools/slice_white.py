"""Fatia folhas de sprites desenhadas sobre fundo branco/claro, sem caixas (ex.: Alicia).

Cada personagem/efeito vira um quadro; partículas soltas (faíscas, brasas) são
anexadas ao quadro grande mais próximo. Linhas = animações, ordenadas da esquerda p/ direita.

Uso: python3 tools/slice_white.py assets/reference/alicia_sprites_raw.jpg alicia
"""
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
    "alicia":  [(15, 199, 11), (209, 368, 7), (374, 537, 4), (538, 696, 4), (699, 826, 7), (827, 981, 11),
                (984, 1104, 7), (1107, 1219, 9), (1227, 1320, 9), (1328, 1541, 5), (1551, 1702, 8),
                (1702, 1852, 9), (1852, 2000, 7)],
    "adriano": [(43, 299, 7), (328, 555, 7), (577, 824, 4), (850, 1081, 5), (1107, 1336, 5, [192, 412, 695, 885]),
                (1348, 1472, 5, [290, 560, 855, 1015]),
                (1472, 1710, 5), (1713, 1984, 8)],
    "rogerio": [(41, 300, 8), (318, 572, 6), (588, 851, 8), (852, 1041, 10), (1057, 1325, 7), (1345, 1538, 8),
                (1571, 1648, 5), (1649, 1826, 7), (1826, 2000, 8)],
    "barba":   [(24, 335, 11, [122, 236, 350, 460, 570, 700, 885, 1030, 1175, 1320]), (335, 609, 10), (672, 953, 5),
                (1013, 1238, 6, [225, 440, 630, 850, 1050]), (1247, 1520, 6), (1536, 1687, 8),
                (1693, 1838, 9), (1838, 2000, 7)],
}


# linha usada como referência de altura (a pose de luta); padrão = linha 0
SCALE_ROW = {"barba": 1}


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


def main(src, name):
    a = np.asarray(Image.open(src).convert("RGB")).astype(int)
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
    print("escala", scale)
    build_atlas(out, ROOT / "assets/sprites" / name, scale)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
