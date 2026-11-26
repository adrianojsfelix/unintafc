"""Gera uma versão do jogo em página única para publicar como artefato (scripts embutidos).

Uso: python3 tools/build_artifact.py <saida.html>
Os atlas, cenários e logo continuam como arquivos ao lado da página (mesmos caminhos de assets/).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text()
head_style = re.search(r"<style>.*?</style>", html, re.S).group(0)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)

# o artefato roda num quadro: tema escuro fixo e foco no jogo ao clicar
head_style = head_style.replace(":root {", ":root { color-scheme: dark;", 1)
extra_css = """<style>
  .bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 1152px; }
  .bar button { font: inherit; font-size: 13px; color: var(--fg); background: #1b1626; border: 2px solid #3a3150; padding: 8px 14px; cursor: pointer; }
  .bar button:hover, .bar button:focus-visible { border-color: var(--accent); outline: none; }
  .bar span { color: var(--muted); font-size: 13px; }
  canvas:focus { outline: none; }
</style>"""
bar = """<div class="bar"><button type="button" id="fs">Tela cheia</button>
<span>Clique no jogo para usar o teclado. No celular, use os botões abaixo da tela.</span></div>"""
focus_js = """<script>
(() => {
  const c = document.getElementById("game");
  c.tabIndex = 0;
  c.addEventListener("pointerdown", () => { c.focus(); window.Sound && Sound.unlock(); });
  document.getElementById("fs").addEventListener("click", () => {
    const el = document.documentElement;
    (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => {});
    c.focus();
  });
})();
</script>"""

def inline(m):
    src = m.group(1)
    return "<script>\n" + (ROOT / src).read_text() + "\n</script>"

body = re.sub(r'<script src="([^"]+)"></script>', inline, body)
body = body.replace('<canvas id="game"', bar + '\n<canvas id="game"', 1)
out = ("<title>UNINTA FIGHTERS</title>\n" + head_style + "\n" + extra_css + "\n" + body.strip() + "\n" + focus_js + "\n")
Path(sys.argv[1]).write_text(out)
print(sys.argv[1], len(out), "bytes")
