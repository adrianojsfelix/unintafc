# Como gerar os sprites no Gemini

Guia para criar as folhas de sprites dos personagens com IA de imagem (Gemini, ChatGPT etc.)
e colocá-las no jogo com o fatiador automático.

## 1. Qual cor de fundo usar?

Use um **fundo liso de cor chapada** que **não aparece no personagem nem nos poderes dele**.
O fatiador apaga essa cor e o desenho fica com transparência.

| Fundo | Comando | Quando usar |
|---|---|---|
| **Magenta `#FF00FF`** (recomendado) | `--bg magenta` | Padrão. Ninguém do elenco usa rosa/roxo forte, exceto a esfera roxa do Rogério |
| **Verde `#00FF00`** | `--bg green` | Personagens com poder roxo/rosa (**Rogério**) |
| Branco | (padrão) | Folhas antigas. Evite: letras "UFS", tênis brancos e miolo do fogo se confundem com o fundo |

Não use verde no **Barba**: o poder do ChatGPT é verde-água. Use magenta.

Dicas:
- Peça "**flat solid background, no gradient, no shadow on the background, no checkerboard**".
  Se a IA fizer um "fundo transparente" xadrez, não serve; peça de novo com cor sólida.
- Exporte em **PNG** se possível (JPEG borra as bordas, mas o fatiador aguenta).
- Uma sombrinha oval sob os pés atrapalha pouco, mas o ideal é pedir "no ground shadow".

## 2. Como pedir ao Gemini

A IA não mantém o rosto igual entre pedidos. Para ajudar:

1. **Anexe sempre a foto de referência** da pessoa (recortes em `assets/reference/elenco/`) e,
   se já tiver, uma folha pronta do mesmo personagem.
2. Peça **uma folha com várias linhas**, cada linha = uma animação, todos os quadros
   **virados para a direita**, mesmo tamanho, pés na mesma altura, **espaço vazio entre os quadros**
   (quadros encostados são o principal motivo de recorte errado).
3. Se a folha inteira sair ruim, peça **por partes** (ex.: só linhas 1 a 4, depois 5 a 9), sempre
   reanexando a primeira folha aprovada: "same character, same style and scale as the attached sheet".
4. Gere várias vezes e escolha a melhor. Quadros ruins avulsos podem ser apagados (pintados de magenta)
   em qualquer editor antes de fatiar.

### Prompt base (copie e preencha o bloco do personagem)

```
Create a 16-bit pixel art sprite sheet in the style of 1990s Super Nintendo fighting games.
Character: the person in the attached reference photo, as a fighting game character.
[BLOCO DO PERSONAGEM]

Sheet rules:
- Solid flat MAGENTA background (#FF00FF) filling the whole image. No gradient, no checkerboard, no ground shadow.
- No magenta or pink anywhere on the character or effects.
- Every frame faces RIGHT, same scale, feet on the same baseline in each row.
- Clear empty space between frames; frames must not touch or overlap.
- One animation per row, left to right, in this order:
[LINHAS]
- No text, no labels, no grid lines, no borders.
- Crisp pixel art, dark outline, limited palette, full body visible in every frame.
```

### Linhas padrão (todas as personagens)

```
Row 1: fighting stance idle, 6 frames (breathing loop)
Row 2: walking forward, 8 frames
Row 3: jump: crouch, rise, tuck in the air, land (5 frames)
Row 4: blocking pose 1 frame, crouching 1 frame
Row 5: basic attack (see below), 5 frames
Row 6: special attack 1 (see below), 6-8 frames
Row 7: projectile / effect of special 1 alone, 4 frames + impact burst 2 frames
Row 8: special attack 2 (see below), 6-8 frames
Row 9: getting hit 2 frames, then knocked back, falling and lying on the floor (6 frames)
Row 10: victory pose, 4 frames
Row 11: burning K.O.: character engulfed in flames getting charred, 7 frames, last frame a pile of fire
```

## 3. Blocos de cada personagem

Recortes de referência: `assets/reference/elenco/1_gaby.png` … `7_alicia.png`.
Todos usam polo preta com "UFS" no peito e punho vermelho na manga.

**Gaby** (`1_gaby.png`, fundo magenta)
```
Young woman, long light-brown hair, black polo shirt with "UFS", black wide pants, sandals.
Always carries a small BLACK CAT. Fights mostly with KICKS, uses the cat and FIRE powers.
Basic attack: fast high kick. Special 1: throws a fireball from her hands.
Special 2: throws the black cat, which runs across the floor attacking (draw the cat running alone in row 7 too).
```

**Adriano** (`2_adriano.png`, fundo magenta)
```
Young man, wavy dark-brown hair, black polo with "UFS", lanyard with badge, blue jeans, dark sneakers.
Boxer style: lots of PUNCHES. Basic attack: straight punch, plus a 3-hit punch combo.
Special 1: blue energy ball thrown with both palms forward from the hip (classic wave-fist pose).
Special 2: rising uppercut jump.
```

**Rogério** (`3_rogerio.png`, fundo VERDE `#00FF00`, porque o poder dele é roxo)
```
Man with short dark hair, black square glasses, black polo with "UFS", blue jeans, black shoes.
Carries a LAPTOP. Signature move: CRACKING HIS KNUCKLES (interlaced fingers pushed forward).
Basic attack: punch. Special 1: opens the laptop and shoots fire from the screen.
Special 2: cracks his knuckles and launches a purple-and-fire energy sphere.
```

**Barba** (`4_barba.png`, fundo magenta)
```
Man, very short hair, full dark beard, black polo with "UFS", light grey jeans, white-and-black sneakers, wristwatch.
Uses the POWER OF AI: a glowing teal-green hexagonal knot logo and floating chat bubbles.
Special 1: summons a glowing teal AI symbol that shoots a beam.
Special 2 "Modo Maluco": rips off his shirt (shirtless, wild eyes, teal aura) and attacks with fast frantic punches.
```

**Angelo** (`5_angelo.png`, fundo magenta), **novo**
```
Man, short brown hair, short beard, black polo with "UFS", beige/khaki pants, brown shoes, wristwatch.
Fights holding a SMARTPHONE.
Basic attack: punch. Special 1: raises the phone and takes a photo; a white camera FLASH shoots forward as a projectile
(draw the flash projectile alone in row 7: white star-shaped flash with blue sparkles, 4 frames + burst).
Special 2 "Queixão": his CHIN grows huge and cartoonishly long, and he headbutts/smashes the enemy with the giant chin
(show the chin growing over 3 frames, the hit, then shrinking back).
```

**Kaisson** (`6_kaisson.png`, fundo magenta), **novo**
```
Man, short dark-brown hair, light stubble, big smile, black polo with "UFS", lanyard with badge,
dark navy jeans, white sneakers with red details.
Normal street fighter style: punches and kicks.
Special 1: pulls a LONG BAGUETTE BREAD out of his pocket and aims it like a rifle, shooting bread rolls
(draw the flying bread roll projectile alone in row 7, plus crumbs burst).
Special 2: swings the long baguette like a bat.
```

**Alicia de Moraes** (`7_alicia.png`, fundo magenta)
```
Young woman, long straight dark hair, black polo, long black wide pants, barefoot or sandals.
Uses a WHIP and FLOATS above the ground with a dark psychic aura (like a floating dictator-style villain).
Idle and walk: floating a little above the ground with legs together.
Basic attack: short whip crack. Special 1: long whip lash forward.
Special 2: flies forward horizontally wrapped in purple-black energy (psycho dash).
```

## 4. Colocar a folha no jogo

1. Salve a imagem em `assets/reference/<id>_sprites_raw.png` (ex.: `angelo_sprites_raw.png`).
2. Rode o fatiador com a cor do fundo:
   ```bash
   python3 tools/slice_white.py assets/reference/angelo_sprites_raw.png angelo --bg magenta
   ```
   Requer `pip install pillow numpy scipy`.
3. Como o personagem ainda não está em `REGIONS`, ele detecta as linhas sozinho e imprime algo como
   `"angelo": [(42, 296, 7), (327, 550, 7), ...]` = (topo, base, nº de quadros) de cada linha.
   Confira os quadros em `assets/sprites/angelo/frames/`. Se alguma linha juntou ou separou quadros
   errado, cole essa lista em `REGIONS` (`tools/slice_white.py`), corrija o número e rode de novo.
4. Descreva as animações e golpes em `src/characters.js` (igual aos outros personagens)
   e adicione o personagem à tela de seleção.
