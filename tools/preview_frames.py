"""Monta uma prancha com todos os quadros fatiados e o nome de cada um (rLL_fQQ), para conferir.

Uso: python3 tools/preview_frames.py angelo  ->  assets/sprites/angelo/frames/_preview.png
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
name = sys.argv[1]
d = ROOT / "assets/sprites" / name / "frames"
meta = json.loads((d / "frames.json").read_text())
S = 0.5
rows = []
for row in meta:
    ims = [(f["file"][:-4], Image.open(d / f["file"])) for f in row["frames"]]
    ims = [(n, im.resize((max(1, int(im.width * S)), max(1, int(im.height * S))))) for n, im in ims]
    rows.append(ims)
W = max(sum(im.width + 12 for _, im in r) for r in rows) + 10
H = sum(max(im.height for _, im in r) + 24 for r in rows if r) + 10
out = Image.new("RGB", (W, H), (40, 44, 70))
g = ImageDraw.Draw(out)
y = 5
for r in rows:
    if not r:
        continue
    h = max(im.height for _, im in r)
    x = 5
    for n, im in r:
        out.paste(im, (x, y + h - im.height), im)
        g.rectangle([x, y, x + im.width, y + h], outline=(90, 90, 130))
        g.text((x + 2, y + h + 4), n, fill=(255, 230, 120))
        x += im.width + 12
    y += h + 24
out.save(d / "_preview.png")
print(d / "_preview.png", out.size)
