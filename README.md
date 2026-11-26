# UFS Fighter

Jogo de luta 2D no estilo dos fliperamas/SNES dos anos 90, com o elenco da UFS.

## Como rodar

```bash
python3 -m http.server 8000
```
Abra http://localhost:8000 (precisa de servidor por causa do carregamento do atlas).

**Controles** — P1: A/D andar · W pular · S agachar · J bastão · K bola de fogo · L gato ·
segurar para trás = defesa. P2: setas · Enter · `.` · `/` (qualquer tecla do P2 assume o lugar da CPU).
`1` alterna CPU/boneco de treino, `H` mostra hitboxes, `R` reinicia o round.

## Estrutura

| Caminho | O que é |
|---|---|
| `assets/reference/gaby_sprites_raw.jpg` | Folha de sprites original da Gaby (caixas magenta sobre verde) |
| `assets/reference/` | Folhas de modelo e elenco |
| `tools/slice_sheet.py` | Fatia a folha, remove o fundo e monta `atlas.png` + `atlas.json` |
| `assets/sprites/gaby/atlas.*` | 150 quadros, paleta indexada de 128 cores, âncora nos pés |
| `src/game.js` | Motor: animações, golpes, projéteis, hitbox/hurtbox, HUD, CPU |

Para regerar o atlas depois de trocar a folha: `python3 tools/slice_sheet.py` (requer Pillow, numpy, scipy).

## Linhas da folha → animações

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
| 9–10 | levar golpe, cair, deitada |
| 11–14 | K.O. queimada (quando o golpe final é a bola de fogo) |

## Etapas

1. **Gaby** ✅ jogável com os sprites próprios
2. Demais personagens do elenco (6)
3. Cenários (campus, laboratório, cantina…)
4. Tela de título, seleção de personagem, som e música
