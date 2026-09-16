# Quickstart: Gerador de Selo Eu Voto

## Prerequisites

- Python 3 ou outro servidor HTTP estático.
- Um navegador moderno com Canvas 2D.

## Run locally

```bash
python3 -m http.server 4173 --directory .
```

Abra `http://localhost:4173/`.

O `index.html` também pode ser aberto diretamente, mas o servidor local é o modo
recomendado para que o download do Canvas tenha todas as permissões do navegador.

## Validation scenarios

1. Escolha cada um dos três modelos e confirme que o estado ativo muda.
2. Use o exemplo Humberto, arraste a foto, ajuste o zoom e clique em redefinir.
3. Carregue uma foto local e confirme que ela aparece atrás da moldura.
4. Clique em “Baixar selo” e confirme PNG 1080 × 1080.
5. Reduza a viewport para 360 px e confirme ausência de rolagem horizontal.
6. Arraste um arquivo que não seja imagem e confirme a mensagem de erro sem
   substituir a prévia.
7. Confira especialmente os modelos 2 e 3: a faixa branca externa deve ficar
   contínua, sem pequenos recortes aparecendo sobre a foto.

## Privacy check

Desconecte a rede após abrir a página e repita o fluxo; a criação e o download
devem continuar funcionando porque a foto nunca deixa o dispositivo.
