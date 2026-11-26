"""Prepara os cenários e o logo a partir das imagens em assets/reference/stages/.

Saída: assets/stages/<id>.png (tamanho exato da tela 384x224, já no enquadramento da luta)
       assets/ui/logo.png (logo da UNINTA endireitado, fundo transparente)
Uso: python3 tools/build_stages.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "assets/reference/stages"
W, H = 384, 224

# (arquivo, escala para a altura/largura, deslocamento do recorte x, y) — o chão da luta fica em y=204
STAGES = {
    "sala": ("sala_de_aula.jpg", "width", 0, 18),
    "clinica": ("clinica.jpg", "height", 10, 0),
}


def stage(src, fit, ox, oy):
    im = Image.open(REF / src).convert("RGB")
    s = W / im.width if fit == "width" else H / im.height
    big = im.resize((round(im.width * s), round(im.height * s)), Image.Resampling.LANCZOS)
    return big.crop((ox, oy, ox + W, oy + H))


def logo():
    im = Image.open(REF / "clinica.jpg").convert("RGB").crop((1240, 190, 1620, 360))
    # a placa está em perspectiva (sobe para a direita): desfaz a inclinação com um cisalhamento
    k = 0.11
    w, h = im.size
    im = im.transform((w, h + int(k * w)), Image.Transform.AFFINE, (1, 0, 0, -k, 1, 0), Image.Resampling.BICUBIC,
                      fillcolor=(235, 235, 235))
    a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    sat = np.max(a, axis=2) - np.min(a, axis=2)
    alpha = np.clip((sat - 30) * 6, 0, 255)           # vermelho/laranja ficam; parede branca e linha cinza somem
    alpha[r < b + 30] = 0                             # tira pedacinhos do céu azul
    out = Image.fromarray(np.dstack([a, alpha]).astype(np.uint8), "RGBA")
    out = out.crop(out.getchannel("A").point(lambda v: 255 if v > 60 else 0).getbbox())
    return out


if __name__ == "__main__":
    for sid, args in STAGES.items():
        stage(*args).save(ROOT / f"assets/stages/{sid}.png")
    logo().save(ROOT / "assets/ui/logo.png")
    print("ok")
