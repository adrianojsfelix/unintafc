# -*- coding: utf-8 -*-
"""Thumbnail 1280x720. Deixa o lado direito livre pra foto do apresentador (recorte PNG)."""
import os
from PIL import Image, ImageDraw
import render as R

W, H = 1280, 720
img = R.sertao().resize((W, H))
d = ImageDraw.Draw(img, "RGBA")
d.rectangle((0, 0, W, H), fill=(8, 14, 26, 120))
# faixa escura à esquerda pra leitura
for x in range(0, 900):
    al = int(230 * (1 - max(0, x - 500) / 400))
    d.line((x, 0, x, H), fill=(8, 14, 26, al))
F = R.F
d.text((60, 70), "GANHO POUCO", font=F(104, "Black"), fill=(246, 241, 232))
d.text((60, 185), "E DEVO MUITO?", font=F(104, "Black"), fill=(242, 181, 68))
# selo de dívida riscada
d.rounded_rectangle((60, 340, 560, 470), 22, fill=(229, 72, 77, 255))
d.text((310, 405), "R$ 11.000", font=F(92, "Black"), fill=(255, 255, 255), anchor="mm")
d.line((80, 440, 540, 370), fill=(255, 255, 255, 235), width=12)
d.text((600, 405), "→ R$ 0", font=F(92, "Black"), fill=(63, 179, 127), anchor="lm")
d.rounded_rectangle((60, 520, 640, 610), 18, fill=(246, 241, 232, 255))
d.text((350, 565), "O PLANO EM 6 PASSOS", font=F(48, "Black"), fill=(12, 24, 40), anchor="mm")
d.text((60, 650), "+ PDF GRÁTIS", font=F(40, "Black"), fill=(242, 181, 68), anchor="lm")
img.save(os.path.join(R.SAIDA, "thumbnail.png"))
print("ok")
