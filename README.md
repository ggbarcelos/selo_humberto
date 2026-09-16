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

## PWA e permissões no celular

O gerador também pode ser instalado como PWA (Progressive Web App). Em Android e
Chrome/Edge compatíveis, o cartão **Instale o gerador no celular** abre o prompt
nativo. No navegador do iPhone/iPad, especialmente no Safari, use o caminho manual:
**Compartilhar → Adicionar à Tela de Início**.

Para o prompt de instalação funcionar, o site precisa estar em HTTPS. `localhost`
e `127.0.0.1` são exceções seguras para desenvolvimento. O manifesto está em
[`manifest.webmanifest`](manifest.webmanifest), o service worker em [`sw.js`](sw.js)
e os ícones oficiais redimensionados ficam em [`img/pwa/`](img/pwa/). Os ícones
`*-maskable.png` têm padding seguro para que o sistema possa aplicar máscaras
circulares ou arredondadas sem cortar o desenho oficial.

Ao publicar uma nova versão, incremente manualmente a constante `CACHE_NAME` no
`sw.js` (por exemplo, de `selo-humberto-v2` para `selo-humberto-v3`) para forçar
a atualização do cache offline.

O seletor de foto usa apenas `<input type="file" accept="image/*">`: ele não
solicita permissão persistente e a imagem é processada localmente no navegador.
O botão **Compartilhar** usa o seletor nativo do sistema quando a Web Share API
está disponível. Uma PWA não recebe acesso direto e silencioso ao rolo da câmera
ou à galeria; o usuário escolhe o destino no compartilhamento. Se no futuro for
adicionado um recurso de câmera ao vivo, será necessária uma solicitação explícita
de permissão via `getUserMedia`, além de HTTPS.

A identidade visual usa os assets oficiais copiados de `lp_humberto` (`img/logohumberto.png`
e `img/numero.png`) e as fontes locais da campanha. Para recriar as máscaras
transparentes dos selos após trocar os frames, execute `python3
scripts/build-overlays.py`.

## Estrutura Spec Kit

Os requisitos, decisões e tarefas estão em [`specs/001-selo-avatar/`](specs/001-selo-avatar/).
