# -*- coding: utf-8 -*-
"""Gera ROTEIRO.md (teleprompter com minutagem) e DESCRICAO-YOUTUBE.md a partir de conteudo.py."""
import os
import conteudo as C

AQUI = os.path.dirname(os.path.abspath(__file__))
tl, total = C.linha_do_tempo()

def mmss(x):
    return f"{int(x // 60)}:{int(x % 60):02d}"

r = [f"# Roteiro: {C.TITULO}", "",
     f"**Canal:** {C.CANAL}  ",
     f"**Duração:** ~{mmss(total)} (narração calma, ~{int(C.PALAVRAS_POR_SEG * 60)} palavras/min)  ",
     "**Voz:** cearense, de conversa, sem pressa. Fala como quem explica pro primo na calçada.", "",
     "> A história pessoal (cenas *Gancho*, *Minha história* e *Fechamento*) é um modelo. "
     "Troque pelos fatos reais do apresentador: idade, cidade, valor da dívida e tempo pra sair dela. "
     "Se mudar valores, ajuste também em `conteudo.py` e rode o render de novo.", "",
     "---", ""]
for c, ini, d in tl:
    r.append(f"## [{mmss(ini)}–{mmss(ini + d)}] {c['titulo']}")
    r.append("")
    if c["narracao"]:
        r.append(c["narracao"])
    else:
        r.append("*(sem fala)*")
    r.append("")
    r.append(f"*Na tela / direção:* {c['notas']}")
    r.append("")
r += ["---", "", "## Fontes dos dados", ""]
r += [f"- [{n}]({u})" for n, u in C.FONTES]
open(os.path.join(AQUI, "ROTEIRO.md"), "w", encoding="utf-8").write("\n".join(r) + "\n")

caps = "\n".join(f"{mmss(ini)} {c['titulo']}" for c, ini, d in tl if c["id"] != "vinheta")
desc = f"""# Publicação no YouTube

## Título (escolha um)
1. {C.TITULO}
2. Ganho 1 salário mínimo e devo muito: faz isso primeiro
3. Eu devia R$ 11 mil ganhando um salário mínimo. Foi assim que eu saí

## Descrição

Tu ganha pouco, tá endividado e não sabe por onde começar? Eu já fui liso de dar dó, com nome sujo e três cartões estourados. Neste vídeo eu te mostro, com números de 2026, os 6 passos que me tiraram do vermelho.

📄 BAIXE O GUIA GRÁTIS (PDF): [COLE AQUI O LINK DO PDF]
Tem planilha de orçamento, lista de dívidas, diário de gastos de 30 dias, roteiro de negociação e checklist anti-golpe.

⏱️ Capítulos
{caps}

📊 Fontes dos dados
""" + "\n".join(f"- {n}: {u}" for n, u in C.FONTES) + """

⚠️ Conteúdo educativo. Não é recomendação individual de investimento ou crédito. Confira sempre a taxa (CET) do teu contrato.

## Tags
dívidas, como sair das dívidas, nome sujo, salário mínimo, educação financeira, finanças pessoais, cartão de crédito, rotativo, juros, orçamento, superendividamento, Serasa, negociar dívidas, bola de neve, avalanche, Ceará, nordeste

## Ideias de Shorts (cortes)
- 3:49 "Botei o cartão no congelador" (Passo 2)
- 2:19 "442% ao ano: a conta do rotativo" (O vilão)
- 5:41 "Se pedirem pix pra limpar teu nome, é golpe" (Passo 5)
"""
open(os.path.join(AQUI, "DESCRICAO-YOUTUBE.md"), "w", encoding="utf-8").write(desc)
print("ok")
