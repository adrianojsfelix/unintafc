# UNINTA FIGHTERS

Jogo de luta 2D no estilo dos fliperamas/SNES dos anos 90, com o elenco do marketing da UNINTA.

**Fluxo:** tela de título → escolha dos lutadores → escolha do cenário (sala de aula ou clínica de odontologia) → luta.

**Elenco:** Gaby, Adriano, Rogério, Barba, Angelo, Kaisson e Alicia de Moraes.

## Como rodar

```bash
python3 -m http.server 8000
```
Abra http://localhost:8000 (precisa de servidor por causa do carregamento do atlas).

**Controles** — P1: A/D andar · W pular · S agachar · J / K / L golpes · segurar para trás = defesa.
P2: setas · Enter · `.` · `/` (qualquer tecla do P2 assume o lugar da CPU). `Esc` volta à seleção.

| Personagem | J | K | L |
|---|---|---|---|
| Gaby | chute alto | bola de fogo | gato |
| Adriano | dois socos | gancho voador | bola de energia |
| Rogério | soco | fogo do notebook | estala os dedos + esfera roxa |
| Barba | soco | símbolo da IA (ChatGPT) | modo maluco sem camisa |
| Angelo | soco | foto com flash | queixão |
| Kaisson | soco | pão que atira | baguete de taco |
| Alicia | chicotada curta | chicotada longa | voo sombrio (flutua parada) |
`1` alterna CPU/boneco de treino, `M` liga/desliga o som, `H` mostra hitboxes, `R` reinicia o round.

## Estrutura

| Caminho | O que é |
|---|---|
| `assets/reference/<id>_sprites_raw.jpg` | Folha de sprites de cada personagem (fundo magenta, gerada no Gemini) · `*_v1.jpg` = folhas antigas |
| `assets/reference/` | Folhas de modelo e elenco |
| `tools/slice_sheet.py` | Monta `atlas.png` + `atlas.json` (e fatiava a folha antiga da Gaby, com caixas) |
| `tools/preview_frames.py` | Prancha com todos os quadros fatiados e seus nomes, para escolher os quadros de cada golpe |
| `tools/slice_white.py` | Fatia folhas sobre fundo liso (branco, ou magenta/verde com `--bg`): faixas e nº de quadros por linha em `REGIONS` (detectados sozinhos se faltarem), escala automática para ~112 px |
| `assets/reference/elenco/` | Recorte de cada pessoa do elenco, para anexar no Gemini como referência |
| `docs/PROMPTS_GEMINI.md`, `docs/prompts_gemini.html` | Prompts prontos de cada personagem para copiar no Gemini (gerados por `tools/build_prompt_guide.py`) |
| `docs/SPRITES_GEMINI.md` | Como gerar folhas de sprites no Gemini: cor de fundo, prompts prontos de cada personagem |
| `src/characters.js` | Animações e golpes de cada personagem |
| `assets/sprites/<id>/atlas.*` | Quadros do personagem, paleta indexada de 128 cores, âncora nos pés |
| `src/game.js` | Motor: animações, golpes, projéteis, hitbox/hurtbox, HUD, CPU |
| `src/audio.js` | Músicas originais do título e de combate + efeitos (soco e chute com sangue, poderes de cada um, defesa, dor, K.O.), sintetizados com Web Audio |
| `assets/reference/stages/` | Cenários originais (sala de aula, clínica) |
| `assets/stages/`, `assets/ui/logo.png` | Cenários já no tamanho da tela e logo endireitado, gerados por `tools/build_stages.py` |

Para regerar os atlas (requer Pillow, numpy, scipy):

```bash
for n in gaby barba angelo kaisson alicia; do python3 tools/slice_white.py assets/reference/${n}_sprites_raw.jpg $n --bg magenta; done
python3 tools/slice_white.py assets/reference/adriano_sprites_raw.jpg adriano --bg magenta
python3 tools/slice_white.py assets/reference/rogerio_sprites_raw.jpg rogerio --bg green
python3 tools/preview_frames.py angelo   # confere os quadros: assets/sprites/angelo/frames/_preview.png
```

**Novo personagem:** gere a folha seguindo [`docs/PROMPTS_GEMINI.md`](docs/PROMPTS_GEMINI.md), salve em
`assets/reference/<id>_sprites_raw.jpg`, rode o fatiador com `--bg magenta`, confira a prancha e descreva
animações e golpes em `src/characters.js` (os quadros são `rLL_fQQ` = linha, quadro).

## Etapas

1. **Gaby** ✅ jogável com os sprites próprios
2. **Elenco completo (7)** ✅ + tela de seleção · todos com as folhas novas do Gemini
3. Cenários: sala de aula e clínica ✅
4. Tela de título, música animada, sons dos golpes e sangue ✅
