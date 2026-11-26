# -*- coding: utf-8 -*-
"""Fonte única do vídeo: cada cena tem a narração (roteiro), o visual e as notas.
O render do vídeo, as legendas (.srt) e o roteiro em Markdown saem daqui."""

CANAL = "Do Sertão ao Saldo"
TITULO = "Ganho pouco e devo muito: o plano que me tirou do buraco"
SUBTITULO = "6 passos, com números de 2026, pra quem tá liso e endividado"

# Ritmo de leitura: ~2,6 palavras por segundo (fala calma, didática).
PALAVRAS_POR_SEG = 2.6

CENAS = [
    {
        "id": "gancho",
        "titulo": "Gancho",
        "visual": "gancho",
        "narracao": (
            "Macho, se tu ganha pouco, tá devendo até a alma e já acordou de madrugada "
            "fazendo conta no celular, esse vídeo é pra tu. "
            "Eu já fui liso de dar dó. Nome sujo, três cartão estourado e salário mínimo. "
            "Hoje eu vivo dos meus investimentos. "
            "E não, não foi sorte, nem curso milagroso. Foi um plano simples, que eu vou te "
            "mostrar agora, passo a passo, com os números de verdade. "
            "E no final tem um material de apoio em PDF, de graça, pra tu imprimir e botar na geladeira."
        ),
        "notas": "Câmera fechada no rosto, tom de conversa de calçada. Corte seco a cada frase.",
    },
    {
        "id": "vinheta",
        "titulo": "Vinheta",
        "visual": "vinheta",
        "narracao": "",
        "duracao": 4.0,
        "notas": "Vinheta curta do canal com som de moeda.",
    },
    {
        "id": "historia",
        "titulo": "Minha história",
        "visual": "historia",
        "narracao": (
            "Deixa eu te contar de onde eu vim. Eu nasci no interior do Ceará, "
            "lá no sertão, onde a gente aprende cedo que dinheiro é coisa que some. "
            "Minha mãe vendia tapioca na porta de casa pra botar comida na mesa. "
            "Com dezenove anos eu vim pra Fortaleza, fui trabalhar de atendente, "
            "ganhando um salário mínimo. "
            "Aí chegou o primeiro cartão de crédito. Rapaz, eu me achei rico! "
            "Depois veio o segundo, o terceiro, o crediário da loja. "
            "Com vinte e quatro anos eu devia onze mil reais. Onze mil! "
            "Pra quem ganhava o que eu ganhava, era quase sete salários mínimos de hoje. "
            "Eu tinha vergonha de atender o telefone. "
            "Foi nesse fundo do poço que eu entendi uma coisa: o problema não era só eu. "
            "Era a matemática trabalhando contra mim. E matemática a gente aprende."
        ),
        "notas": "ADAPTE com a história real do apresentador. Usar fotos antigas, rua de terra, carteira de trabalho.",
    },
    {
        "id": "dados",
        "titulo": "Tu não tá sozinho: os números",
        "visual": "dados",
        "narracao": (
            "E se tu tá nessa, olha só: tu não tá sozinho, não. "
            "Segundo a Serasa, o Brasil chegou a oitenta e quatro vírgula dois milhões de "
            "pessoas com conta atrasada em 2026. É recorde. "
            "Na pesquisa da CNC de outubro, oitenta e um vírgula seis por cento das famílias "
            "têm alguma dívida, e quase três em cada dez estão com conta em atraso. "
            "E o dado que mais me pega: quase metade dos inadimplentes, quarenta e oito por cento, "
            "ganha até um salário mínimo. Que hoje é mil seiscentos e vinte e um reais. "
            "Ou seja: dívida não é falta de vergonha na cara. "
            "É gente trabalhadora, apertada, tentando fechar o mês."
        ),
        "notas": "Gráficos animados na tela. Fontes na descrição e no PDF.",
    },
    {
        "id": "juros",
        "titulo": "O vilão: os juros",
        "visual": "juros",
        "narracao": (
            "Agora presta atenção, que essa parte é a mais importante do vídeo. "
            "Sabe quando tu paga só o mínimo da fatura? O resto entra no rotativo. "
            "Em junho de 2026, os juros médios do rotativo estavam em quatrocentos e quarenta e dois "
            "por cento ao ano, segundo o Banco Central. "
            "Isso dá quase quinze por cento por mês. Todo mês. "
            "A poupança, pra tu ter ideia, rende menos de um por cento por mês. "
            "Desde 2024 tem uma lei que diz que os juros e encargos do rotativo e do parcelado "
            "da fatura não podem passar do valor da dívida original. "
            "Quer dizer: mil reais pode virar no máximo dois mil. "
            "Ajudou? Ajudou. Mas dobrar a dívida ainda é uma desgraça, visse? "
            "Então a regra número um é: pagar o mínimo do cartão não é pagar. É afundar devagarinho."
        ),
        "notas": "Mostrar a curva da dívida subindo. Fala mais lenta aqui.",
    },
    {
        "id": "passo1",
        "titulo": "Passo 1 - Raio-X",
        "visual": "passo",
        "passo": 1,
        "passo_titulo": "Raio-X das dívidas",
        "itens": ["Anota TODO gasto por 30 dias", "Lista cada dívida: credor, valor, juros, atraso",
                  "Consulta o Registrato do Banco Central (grátis)"],
        "narracao": (
            "Passo um: o raio-X. Ninguém conserta o que não enxerga. "
            "Durante trinta dias, tu vai anotar tudo que sai do teu bolso. Tudo! "
            "Do pão ao pix pro cunhado. "
            "Depois, faz uma lista de cada dívida: com quem é, quanto é, quanto de juros e há quanto tempo tá atrasada. "
            "Uma dica de ouro: entra no Registrato, que é um site do Banco Central, de graça, "
            "e lá aparece todo empréstimo e cartão no teu nome. Sem susto, sem surpresa. "
            "No PDF tem a tabela prontinha pra tu preencher."
        ),
        "notas": "Mostrar caderno, tela do Registrato (gravar a própria tela).",
    },
    {
        "id": "passo2",
        "titulo": "Passo 2 - Estanca o sangramento",
        "visual": "passo",
        "passo": 2,
        "passo_titulo": "Estanca o sangramento",
        "itens": ["Guarda o cartão (literalmente)", "Nada de dívida nova pra pagar dívida velha",
                  "Troca dívida cara por barata, se der"],
        "narracao": (
            "Passo dois: estancar o sangramento. "
            "Não adianta tirar água do barco com o furo aberto. "
            "Guarda o cartão. Eu botei o meu dentro de um pote de água no congelador, sem brincadeira. "
            "Nada de fazer empréstimo novo pra pagar dívida velha, a não ser que seja pra trocar "
            "uma dívida cara por uma bem mais barata. "
            "Por exemplo: sair do rotativo de quatrocentos por cento ao ano "
            "pra um empréstimo de juros bem menor. Aí sim é negócio."
        ),
        "notas": "Cena do cartão no gelo (rende ótimo corte pra Shorts).",
    },
    {
        "id": "passo3",
        "titulo": "Passo 3 - Orçamento de quem ganha pouco",
        "visual": "orcamento",
        "narracao": (
            "Passo três: o orçamento de quem ganha pouco. "
            "Esquece aquelas regras de cinquenta por cento disso e trinta daquilo, "
            "que foi feita pra quem ganha bem. "
            "Com mil seiscentos e vinte e um, a ordem é outra. Primeiro o que te mantém vivo e trabalhando: "
            "moradia, comida, luz e água, transporte. "
            "No meu exemplo, isso dá mil e trezentos. Sobram trezentos e vinte e um. "
            "Desses, trezentos vão pras dívidas e vinte e um vão pro cofrinho. Vinte e um reais, sim! "
            "E guarda isso: existe uma lei, a do superendividamento, que protege um mínimo pra tu viver. "
            "Ninguém pode te obrigar a um acordo que te deixa sem comer."
        ),
        "notas": "Valores do exemplo são ilustrativos; o PDF traz a planilha em branco.",
    },
    {
        "id": "passo4",
        "titulo": "Passo 4 - A ordem de pagar",
        "visual": "ordem",
        "narracao": (
            "Passo quatro: a ordem de pagar. "
            "Primeiro, as contas que tiram teu chão: aluguel, água, luz, pensão. "
            "Depois, as dívidas. E aqui tem dois jeitos. "
            "O jeito avalanche: tu ataca primeiro a dívida de juros mais alto. "
            "Na ponta do lápis, é o que economiza mais dinheiro. "
            "O jeito bola de neve: tu quita primeiro a menorzinha, "
            "pra ganhar ânimo e ver uma dívida sumindo de verdade. "
            "Qual é o melhor? O que tu consegue manter. Eu comecei na bola de neve, "
            "porque eu precisava acreditar que dava. E deu."
        ),
        "notas": "Animação das duas filas de dívidas.",
    },
    {
        "id": "passo5",
        "titulo": "Passo 5 - Negocia sem cair em golpe",
        "visual": "negocia",
        "narracao": (
            "Passo cinco: negociar sem cair em golpe. "
            "Dívida velha costuma ter desconto grande, porque o banco prefere receber alguma coisa "
            "do que nada. Fica de olho nos feirões de renegociação e nos programas do governo. "
            "Mas negocia só em canal oficial: o aplicativo do banco, o Serasa Limpa Nome, "
            "o consumidor ponto gov ponto br, o Procon. "
            "Se alguém te ligar pedindo pix adiantado pra limpar teu nome, é golpe. "
            "E a regra de ouro do acordo: só fecha parcela que cabe no teu orçamento do passo três. "
            "Acordo que tu não consegue pagar é só uma dívida nova com outro nome."
        ),
        "notas": "Mostrar checklist anti-golpe. Texto da ligação de negociação no PDF.",
    },
    {
        "id": "passo6",
        "titulo": "Passo 6 - O primeiro cofrinho",
        "visual": "cofrinho",
        "narracao": (
            "Passo seis: o primeiro cofrinho. "
            "Sabe por que a gente volta pra dívida? Porque aparece um imprevisto e não tem nada guardado. "
            "Então, mesmo pagando dívida, guarda um pouquinho. "
            "Vinte e um reais por mês, num ano, dá duzentos e cinquenta e dois. "
            "Parece pouco? É o conserto da moto. É o remédio. É não voltar pro cartão. "
            "E quando a última dívida acabar, aqueles trezentos que iam pro banco "
            "passam a vir pra ti. Aí, meu amigo, o jogo vira."
        ),
        "notas": "Barra do cofrinho enchendo. Mostrar a virada: R$ 321/mês pra você.",
    },
    {
        "id": "fechamento",
        "titulo": "Fechamento",
        "visual": "fechamento",
        "narracao": (
            "Eu levei dois anos e meio pra sair do vermelho. Não foi rápido, não foi bonito, mas foi. "
            "E se um cabra do sertão, que vendia tapioca com a mãe, conseguiu, tu consegue também. "
            "Baixa o PDF aqui na descrição, imprime, preenche com lápis e começa hoje, que hoje é o dia. "
            "Se esse vídeo te ajudou, se inscreve e manda pra aquele amigo que tá aperreado. "
            "Um cheiro, e até a próxima!"
        ),
        "notas": "Encerrar olhando pra câmera. Tela final com 2 vídeos sugeridos.",
    },
]

FONTES = [
    ("Serasa - inadimplência recorde de 84,2 milhões (nov/2026)",
     "https://www.band.com.br/economia/macroeconomia/inadimplencia-atinge-recorde-de-842-milhoes-de-pessoas-no-brasil-diz-serasa"),
    ("Serasa - 10 anos do Mapa da Inadimplência (48% ganham até 1 salário mínimo)",
     "https://www.serasa.com.br/imprensa/10-anos-do-mapa-de-inadimplencia/"),
    ("CNC/Peic - 81,6% das famílias endividadas em outubro/2026",
     "https://viva.com.br/dinheiro/endividamento-segue-alto-e-atinge-816-das-familias-em-outubro-aponta-cnc.html"),
    ("Banco Central - rotativo do cartão a 442,4% ao ano (jun/2026)",
     "https://timesbrasil.com.br/brasil/juros-cartao-rotativo-4424-junho/"),
    ("Salário mínimo de 2026: R$ 1.621 (Decreto 12.797/2025)",
     "https://www.band.com.br/economia/noticias/decreto-do-governo-estabelece-valor-do-salario-minimo-a-partir-de-1-de-janeiro-em-r-162100-202512241121"),
    ("Lei 14.690/2023 - teto de juros do rotativo e parcelado (100% da dívida)",
     "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14690.htm"),
    ("Lei 14.181/2021 - Lei do Superendividamento",
     "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14181.htm"),
    ("Registrato - Banco Central", "https://www.bcb.gov.br/cidadaniafinanceira/registrato"),
    ("Consumidor.gov.br", "https://www.consumidor.gov.br"),
]


def palavras(txt):
    return len(txt.split())


def duracao(cena):
    if "duracao" in cena:
        return cena["duracao"]
    return round(palavras(cena["narracao"]) / PALAVRAS_POR_SEG + 1.5, 2)


def linha_do_tempo():
    t = 0.0
    out = []
    for c in CENAS:
        d = duracao(c)
        out.append((c, t, d))
        t += d
    return out, t
