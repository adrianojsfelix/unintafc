# UFS Fighter

Jogo de luta 2D no estilo dos fliperamas/SNES dos anos 90, com o elenco da UFS.

**Elenco:** Gaby, Alicia de Morais, Adriano, Rogério e Barba.

## Como rodar

```bash
python3 -m http.server 8000
```
Abra http://localhost:8000 (precisa de servidor por causa do carregamento do atlas).

**Controles** — P1: A/D andar · W pular · S agachar · J / K / L golpes · segurar para trás = defesa.
P2: setas · Enter · `.` · `/` (qualquer tecla do P2 assume o lugar da CPU). `Esc` volta à seleção.

| Personagem | J | K | L |
|---|---|---|---|
| Gaby | bastão | bola de fogo | gato |
| Alicia | chicotada curta | chicotada longa | rajada de fogo |
| Adriano | soco | chute alto | bola de energia |
| Rogério | soco | sequência de 3 socos | esfera roxa |
| Barba | soco | arco de fogo | soco de fogo |
`1` alterna CPU/boneco de treino, `M` liga/desliga o som, `H` mostra hitboxes, `R` reinicia o round.

## Estrutura

| Caminho | O que é |
|---|---|
| `assets/reference/gaby_sprites_raw.jpg` | Folha de sprites original da Gaby (caixas magenta sobre verde) |
| `assets/reference/` | Folhas de modelo e elenco |
| `tools/slice_sheet.py` | Fatia folhas com caixas magenta sobre verde (Gaby) e monta `atlas.png` + `atlas.json` |
| `tools/slice_white.py` | Fatia folhas sobre fundo branco (Alicia, Adriano, Rogério, Barba): faixas e nº de quadros por linha em `REGIONS`, escala automática para ~112 px |
| `src/characters.js` | Animações e golpes de cada personagem |
| `assets/sprites/<id>/atlas.*` | Quadros do personagem, paleta indexada de 128 cores, âncora nos pés |
| `src/game.js` | Motor: animações, golpes, projéteis, hitbox/hurtbox, HUD, CPU |
| `src/audio.js` | Música de combate original e efeitos (golpe, defesa, fogo, explosão, miado, dor, K.O.), sintetizados com Web Audio |

Para regerar os atlas (requer Pillow, numpy, scipy):

```bash
python3 tools/slice_sheet.py
python3 tools/slice_white.py assets/reference/alicia_sprites_raw.jpg alicia
```

**Novo personagem:** salve a folha em `assets/reference/<id>_sprites_raw.jpg`, adicione as faixas em
`REGIONS` (`tools/slice_white.py`), rode o fatiador e descreva animações e golpes em `src/characters.js`.

## Linhas da folha da Gaby → animações

| Linha | Uso no jogo |
|---|---|
| 0 | parada |
| 1 | andar para frente |
| 2, 4 | especiais com a bola vermelha (ainda não usados) |
| 3 | explosão de impacto |
| 5 | gato correndo (projétil do golpe L) |
| 6 | 0 = defesa/agachar · 1–6 = pulo · 7–10 = bola de fogo |
| 7 | 0–2 = lançar fogo · 3–5 = golpe de bastão · 7 = pose |
| 8 | invocar e lançar o gato · 0–2 = vitória |
| 9–10 | levar golpe, voar, rolar e ficar deitada |
| 11–14 | K.O. queimada (quando o golpe final é a bola de fogo) |

## Etapas

1. **Gaby** ✅ jogável com os sprites próprios
2. **Alicia, Adriano, Rogério e Barba** ✅ + tela de seleção · falta 1 personagem do elenco
3. Cenários (campus, laboratório, cantina…)
4. Tela de título, seleção de personagem, som e música
