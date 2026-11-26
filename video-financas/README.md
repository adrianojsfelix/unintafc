# Vídeo: "Ganho pouco e devo muito" — canal Do Sertão ao Saldo

Tudo sai de **`conteudo.py`** (roteiro, tempos, fontes). Mudou o texto? Roda de novo.

| Arquivo | O que é |
|---|---|
| `ROTEIRO.md` | Roteiro/teleprompter com minutagem e direção de cena |
| `DESCRICAO-YOUTUBE.md` | Títulos, descrição com capítulos, fontes, tags e ideias de Shorts |
| `saida/video-final.mp4` | Vídeo 1080p30 com motion graphics, legendas na tela e trilha |
| `saida/so_video.mp4` | Mesmo vídeo sem áudio (gerado pelo `render.py`, não vai pro git) |
| `saida/trilha.m4a` | Trilha original sintetizada (lo-fi com levada de baião), sem direitos de terceiros |
| `saida/legendas.srt` | Legendas pra subir no YouTube |
| `saida/Saindo-do-Vermelho-guia.pdf` | Material de apoio (8 páginas, imprimível) |
| `saida/thumbnail.png` | Thumbnail 1280x720 (lado direito livre pra tua foto) |

## Gerar de novo

```bash
python3 render.py            # vídeo (partes em paralelo) + legendas.srt
python3 trilha.py            # trilha sonora
python3 thumbnail.py
python3 gerar_roteiro.py     # ROTEIRO.md e DESCRICAO-YOUTUBE.md
node pdf/gerar_pdf.js        # PDF (precisa do Playwright)
ffmpeg -i saida/so_video.mp4 -i saida/trilha.wav -c:v copy -c:a aac -b:a 192k -shortest saida/video-final.mp4
```

## Gravando a narração

O vídeo foi cronometrado pra uma fala de ~156 palavras/min. Grava lendo o `ROTEIRO.md`,
joga a voz por cima do `so_video.mp4` + `trilha.wav` no editor (CapCut, DaVinci, Premiere)
e abaixa a trilha mais uns 6 dB onde tiver fala. Se tua leitura ficar mais rápida ou lenta,
ajusta `PALAVRAS_POR_SEG` em `conteudo.py` e renderiza de novo: as cenas se reajustam sozinhas.
