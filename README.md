# UFS Fighter

Jogo de luta 2D no estilo dos fliperamas/SNES dos anos 90, com o elenco da UFS.

## Como rodar

```bash
python3 -m http.server 8000
```
Abra http://localhost:8000 (precisa de servidor por causa do carregamento dos PNGs).

**Controles** — P1: A/D andar · W pular · S agachar · J soco · segurar para trás = defesa.
P2: setas + Enter (qualquer tecla do P2 assume o lugar da CPU). `1` alterna CPU/boneco de treino,
`H` mostra hitboxes, `R` reinicia o round.

## Estrutura

| Caminho | O que é |
|---|---|
| `assets/reference/` | Artes de referência originais (folha da Gaby, elenco completo) |
| `assets/sprites/gaby/` | Sprites gerados: `idle`, `punch`, `block` + `gaby.json` (paleta) |
| `tools/extract_gaby.py` | Recorta a folha, remove o fundo, reduz 4x e aplica paleta de 32 cores |
| `src/game.js` | Motor: laço de 60 Hz, física, hitbox/hurtbox, hitstop, HUD, CPU |

Para regerar os sprites: `python3 tools/extract_gaby.py` (requer Pillow).

## Etapas

1. **Personagem 1 — Gaby** ✅ protótipo jogável (parado, andar, pular, agachar, soco, defesa)
2. Animações completas da Gaby (andar, chute, levar golpe, queda, vitória, especial)
3. Demais personagens do elenco (6)
4. Cenários (campus, laboratório, cantina…)
5. Tela de título, seleção de personagem, som e música
