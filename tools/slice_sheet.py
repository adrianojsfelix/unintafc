"""Fatia a folha de sprites da Gaby (quadros em caixas magenta sobre fundo verde).

Saída: assets/sprites/gaby/frames/rXX_fYY.png (com transparência) + frames.json
Uso: python3 tools/slice_sheet.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/reference/gaby_sprites_v1.jpg"
OUT = ROOT / "assets/sprites/gaby/frames"


SPLIT = {}                                  # (linha, quadro): colunas de corte
MERGE_PREV = set()                          # pedaço que se soltou do quadro anterior


def masks(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > 150) & (r < 120) & (b < 120)
    magenta = (r > 150) & (b > 150) & (g < 120)
    return green, magenta


def _unused_split_columns(mag, x0, x1, y0, y1):
    """Acha as linhas cinzas verticais que separam caixas encostadas."""
    sub = mag[y0:y1, x0:x1]
    h, w = sub.shape
    score = np.zeros(w)
    for x in range(3, w - 3):
        left = sub[:, x - 4:x - 1].any(axis=1)
        right = sub[:, x + 2:x + 5].any(axis=1)
        score[x] = (~sub[:, x] & ~sub[:, x + 1] & left & right).sum() / h
    cuts, x = [], 0
    while x < w:
        if score[x] > 0.55:
            run = x
            while x < w and score[x] > 0.3:
                x += 1
            cuts.append(x0 + (run + x) // 2)
        x += 1
    return cuts


def main():
    a = np.asarray(Image.open(SRC).convert("RGB")).astype(int)
    green, magenta = masks(a)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # fundo verde + linhas finas entre caixas (verde borrado pelo JPEG)
    greenish = (g > r + 8) & (g > b + 8) & (g > 100)
    fg = ndimage.binary_erosion(~greenish, iterations=1)
    lab, n = ndimage.label(fg)
    boxes = []
    for s_, cnt in zip(ndimage.find_objects(lab), ndimage.sum(fg, lab, range(1, n + 1))):
        if cnt < 600:
            continue
        y0, x0, y1, x1 = s_[0].start - 1, s_[1].start - 1, s_[0].stop + 1, s_[1].stop + 1
        boxes.append((max(0, y0), max(0, x0), y1, x1))

    # caixas que ficaram grudadas (linha divisória apagada pelo JPEG): corta nas colunas
    # onde ainda sobra um traço esverdeado/acinzentado de cima a baixo
    sep = (g > r + 5) & (g > b + 5) & (g > 90)
    def cuts_of(prof, n):
        base = float(np.median(prof))
        cuts = [x for x in range(8, n - 8) if prof[x] > max(0.22, base + 0.18) and prof[x] >= prof[x - 1] and prof[x] >= prof[x + 1]]
        out = []
        for c in cuts:
            if out and c - out[-1] < 12:
                if prof[c] > prof[out[-1]]: out[-1] = c
            else:
                out.append(c)
        return out

    def split(bx, depth=0):
        y0, x0, y1, x1 = bx
        if depth > 3:
            return [bx]
        hc = cuts_of(sep[y0:y1, x0 + 3:x1 - 3].mean(axis=1), y1 - y0)
        if hc:
            e = [0] + hc + [y1 - y0]
            return [q for a_, b_ in zip(e, e[1:]) if b_ - a_ > 10 for q in split((y0 + a_, x0, y0 + b_, x1), depth + 1)]
        vc = cuts_of(sep[y0 + 3:y1 - 3, x0:x1].mean(axis=0), x1 - x0)
        if vc:
            e = [0] + vc + [x1 - x0]
            return [q for a_, b_ in zip(e, e[1:]) if b_ - a_ > 10 for q in split((y0, x0 + a_, y1, x0 + b_), depth + 1)]
        return [bx]

    def tighten(bx):
        y0, x0, y1, x1 = bx
        m = ~greenish[y0:y1, x0:x1]
        ys, xs = np.nonzero(m)
        return (y0 + ys.min(), x0 + xs.min(), y0 + ys.max() + 1, x0 + xs.max() + 1) if len(ys) else bx
    boxes = [tighten(p) for bx in boxes for p in split(bx)]
    boxes = [bx for bx in boxes if bx[2] - bx[0] > 25 and bx[3] - bx[1] > 25
             and (~greenish[bx[0]:bx[2], bx[1]:bx[3]]).mean() > 0.6]

    # agrupa em linhas (animações) pela faixa vertical
    rows = []
    for bx in sorted(boxes):
        cy = (bx[0] + bx[2]) / 2
        for row in rows:
            if row["y0"] - 4 <= cy <= row["y1"] + 4:
                row["b"].append(bx); row["y1"] = max(row["y1"], bx[2]); break
        else:
            rows.append({"y0": bx[0], "y1": bx[2], "b": [bx]})

    # correções manuais onde a linha divisória sumiu no JPEG
    for row in rows:
        row["b"].sort(key=lambda b: b[1])
    fixed = []
    for ri, row in enumerate(rows):
        out = []
        for fi, bx in enumerate(row["b"]):
            y0, x0, y1, x1 = bx
            if (ri, fi) in SPLIT:
                cuts = [x0] + [x0 + c for c in SPLIT[(ri, fi)]] + [x1]
                out += [(y0, l, y1, r_) for l, r_ in zip(cuts, cuts[1:])]
            elif (ri, fi) in MERGE_PREV:
                p_ = out[-1]
                out[-1] = (min(y0, p_[0]), min(x0, p_[1]), max(y1, p_[2]), max(x1, p_[3]))
            elif x1 - x0 < 30 and ri == 3:
                continue  # lasca solta da explosão
            else:
                out.append(bx)
        fixed.append({"b": out})
    rows = fixed
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.png"):
        f.unlink()
    meta = []
    for ri, row in enumerate(rows):
        row["b"].sort(key=lambda b: b[1])
        frames = []
        for fi, (y0, x0, y1, x1) in enumerate(row["b"]):
            crop = a[y0:y1, x0:x1]
            r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
            # chroma key: magenta e franjas rosadas da compressão JPEG
            bg = (r > 140) & (b > 140) & (g < 130)
            fringe = ((r + b) / 2 - g > 70) & (np.abs(r - b) < 80)
            bg |= fringe
            bg |= (g > r + 8) & (g > b + 8)            # restos da linha divisória esverdeada
            bg = ndimage.binary_dilation(bg, iterations=0) if False else bg
            # bordas cinzas da caixa (2 px)
            bg[:2, :] = bg[-2:, :] = True
            bg[:, :2] = bg[:, -2:] = True
            # franja rosada que sobra encostada no recorte: some; no miolo, tira o tom magenta
            pink = (r - g > 40) & (b - g > 40)
            for _ in range(2):
                edge = pink & ndimage.binary_dilation(bg)
                bg |= edge
            crop = crop.copy()
            inner = pink & ~bg
            crop[..., 2] = np.where(inner, crop[..., 1], crop[..., 2])
            # restos da divisória: pedacinhos finos (até 2 px de largura) soltos perto das bordas
            lab_, nl = ndimage.label(~bg)
            for k, sl in enumerate(ndimage.find_objects(lab_), 1):
                w_ = sl[1].stop - sl[1].start
                near = sl[1].start < 8 or sl[1].stop > bg.shape[1] - 8
                if w_ <= 2 and near:
                    bg[sl][lab_[sl] == k] = True
            alpha = np.where(bg, 0, 255).astype(np.uint8)
            img = Image.fromarray(np.dstack([crop.astype(np.uint8), alpha]), "RGBA")
            name = f"r{ri:02d}_f{fi:02d}.png"
            img.save(OUT / name)
            frames.append({"file": name, "src": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]})
        meta.append({"row": ri, "frames": frames})
        print(ri, len(frames), [f["src"][2:] for f in frames])
    (OUT / "frames.json").write_text(json.dumps(meta, indent=1))


if __name__ == "__main__":
    main()


def build_atlas(frames_dir=None, dst=None, scale=1.0):
    """Empacota os quadros num atlas único + JSON com retângulo e âncora (pés) de cada quadro."""
    frames_dir = frames_dir or OUT
    dst = dst or ROOT / "assets/sprites/gaby"
    meta = json.loads((frames_dir / "frames.json").read_text())
    items = []
    for row in meta:
        # escala única ou por linha ({linha: escala, None: padrão}), para igualar linhas desenhadas em tamanhos diferentes
        s = scale.get(row["row"], scale[None]) if isinstance(scale, dict) else scale
        for f in row["frames"]:
            im = Image.open(frames_dir / f["file"])
            bb = im.getchannel("A").getbbox()
            if bb is None:
                continue  # quadro que ficou vazio (ex.: últimas faíscas da explosão)
            im = im.crop(bb)
            if s != 1.0:
                size = (max(1, round(im.width * s)), max(1, round(im.height * s)))
                rgb = im.convert("RGB").resize(size, Image.Resampling.BOX)
                al = im.getchannel("A").resize(size, Image.Resampling.BOX).point(lambda v: 255 if v > 120 else 0)
                im = rgb.convert("RGBA"); im.putalpha(al)
                bb2 = al.getbbox()
                if bb2 is None:
                    continue
            a = np.asarray(im)[..., 3] > 0
            ys, xs = np.nonzero(a)
            items.append((f["file"][:-4], im, float(xs.mean()), im.height, f["src"]))
    W, x, y, rowh, rects = 1024, 0, 0, 0, {}
    for name, im, cx, h, _ in sorted(items, key=lambda t: -t[1].height):
        if x + im.width > W:
            x, y, rowh = 0, y + rowh + 1, 0
        rects[name] = [x, y, im.width, im.height, round(cx), h]
        x += im.width + 1; rowh = max(rowh, im.height)
    atlas = Image.new("RGBA", (W, y + rowh), (0, 0, 0, 0))
    for name, im, _, _, _ in items:
        atlas.paste(im, tuple(rects[name][:2]))
    # paleta indexada de 128 cores (como no hardware antigo): limpa o ruído do JPEG e deixa o arquivo leve
    alpha = np.asarray(atlas.getchannel("A")) > 0
    rgb = atlas.convert("RGB")
    pal = Image.fromarray(np.asarray(rgb)[alpha][None, :, :]).quantize(127, method=Image.Quantize.MEDIANCUT)
    q = np.asarray(rgb.quantize(palette=pal, dither=Image.Dither.NONE)).copy()
    q[~alpha] = 127
    out = Image.fromarray(q.astype(np.uint8), "P")
    p_ = pal.getpalette()[:127 * 3] + [255, 0, 255]
    out.putpalette(p_)
    out.save(dst / "atlas.png", optimize=True, transparency=127)
    # [x, y, w, h, âncoraX (centro de massa), âncoraY (base)]
    (dst / "atlas.json").write_text(json.dumps(rects, separators=(",", ":")))
    print("atlas", atlas.size, len(rects), "quadros")


if __name__ == "__main__":
    build_atlas()
