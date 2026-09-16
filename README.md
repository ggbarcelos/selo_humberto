# Gerador de selo Eu voto 65065

Página estática para a campanha Humberto Matos. A pessoa escolhe uma das três
molduras, carrega uma foto, ajusta o enquadramento e baixa um PNG quadrado de
1080 × 1080.

## Rodar localmente

```bash
python3 -m http.server 4173 --directory .
```

Abra <http://localhost:4173/>.

Também é possível abrir `index.html` diretamente no computador; o script usa a
versão compatível com esse modo. Para baixar PNG sem limitações do navegador,
prefira o servidor local acima.

O processamento é feito no Canvas do navegador. A foto escolhida não é enviada
para nenhum servidor.

A identidade visual usa os assets oficiais copiados de `lp_humberto` (`img/logohumberto.png`
e `img/numero.png`) e as fontes locais da campanha. Para recriar as máscaras
transparentes dos selos após trocar os frames, execute `python3
scripts/build-overlays.py`.

## Estrutura Spec Kit

Os requisitos, decisões e tarefas estão em [`specs/001-selo-avatar/`](specs/001-selo-avatar/).
