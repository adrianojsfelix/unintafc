"""Extrai os sprites da Gaby da folha de referência e converte para estilo SNES.

Etapas: recorte -> remoção de fundo (flood fill a partir das bordas) ->
redução de escala -> paleta única de 16 cores (como no SNES) -> PNG com transparência.

Uso: python3 tools/extract_gaby.py
"""
from collections import deque
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/reference/gaby_model_sheet.jpg"
OUT = ROOT / "assets/sprites/gaby"
SCALE = 0.25          # 4 px da referência = 1 px do jogo
COLORS = 32           # 31 cores + transparente (2 paletas SNES de 16)

BOXES = {
    "idle":  (180, 715, 520, 1172),
    "punch": (845, 710, 1225, 995),
    "block": (1460, 705, 1765, 1000),
}


def is_bg(p):
    r, g, b = p[:3]
    return min(r, g, b) > 165 and max(r, g, b) - min(r, g, b) < 40


def remove_bg(img):
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        if not is_bg(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return img


def build_punch(sheet):
    """O soco na folha está cortado nas coxas: completa com as pernas da defesa."""
    top = remove_bg(sheet.crop(BOXES["punch"]))
    legs = remove_bg(sheet.crop((1460, 905, 1765, 1000)))  # joelhos -> pés da defesa
    w = max(top.width, legs.width + 10)
    cut = 262  # linha do recorte do soco onde as pernas entram
    out = Image.new("RGBA", (w, cut + legs.height), (0, 0, 0, 0))
    out.alpha_composite(legs, (10, cut))
    piece = top.crop((0, 0, top.width, cut + 8))
    # apara a perna de trás que sai do quadro (evita borda reta no quadril)
    px = piece.load()
    for y in range(215, piece.height):
        t = (y - 215) / (piece.height - 215)
        lo, hi = int(20 + 70 * t), int(235 - 10 * t)
        for x in range(piece.width):
            if x < lo or x > hi:
                px[x, y] = (0, 0, 0, 0)
    out.alpha_composite(piece, (0, 0))
    return out


def main():
    sheet = Image.open(SRC).convert("RGB")
    frames = {
        "idle": remove_bg(sheet.crop(BOXES["idle"])),
        "block": remove_bg(sheet.crop(BOXES["block"])),
        "punch": build_punch(sheet),
    }
    small = {}
    for k, im in frames.items():
        im = im.crop(im.getbbox())
        size = (round(im.width * SCALE), round(im.height * SCALE))
        rgb = im.convert("RGB").resize(size, Image.Resampling.BOX)
        a = im.getchannel("A").resize(size, Image.Resampling.BOX).point(lambda v: 255 if v > 110 else 0)
        small[k] = (rgb, a)

    # paleta compartilhada entre todos os quadros
    total_w = sum(r.width for r, _ in small.values())
    max_h = max(r.height for r, _ in small.values())
    atlas = Image.new("RGB", (total_w, max_h), (0, 0, 0))
    mask = Image.new("L", (total_w, max_h), 0)
    x = 0
    for r, a in small.values():
        atlas.paste(r, (x, 0)); mask.paste(a, (x, 0)); x += r.width
    # só pixels opacos entram na quantização
    opaque = [atlas.getpixel((i, j)) for j in range(max_h) for i in range(total_w) if mask.getpixel((i, j))]
    sample = Image.new("RGB", (len(opaque), 1)); sample.putdata(opaque)
    pal_img = sample.quantize(COLORS - 1, method=Image.Quantize.MEDIANCUT)
    palette = pal_img.getpalette()[: (COLORS - 1) * 3]

    meta = {"scale": SCALE, "palette": [palette[i:i + 3] for i in range(0, len(palette), 3)], "frames": {}}
    OUT.mkdir(parents=True, exist_ok=True)
    for k, (r, a) in small.items():
        q = r.quantize(palette=pal_img, dither=Image.Dither.NONE).convert("RGBA")
        q.putalpha(a)
        q.save(OUT / f"{k}.png")
        meta["frames"][k] = {"w": q.width, "h": q.height}
        print(k, q.size)
    (OUT / "gaby.json").write_text(json.dumps(meta, indent=1))


if __name__ == "__main__":
    main()
