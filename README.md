# Perfeita Luz — Site v3

Recriação do site seguindo o manual de identidade visual (paleta oficial e tipografias Clash Display + Chillax).

## Estrutura
- `index.html` — site principal
- `styles.css` - estilos do site
- `script.js` - interações e renderização de conteúdo
- `site-config.js` - conteúdo padrão e helpers de configuração
- `site-config.json` - arquivo de configuração editável pelo painel
- `config.html` - painel de configuração (dev)
- `config.css` + `admin.js` — UI e lógica do painel

## Como editar conteúdo (cliente)
1. Abra `config.html` no navegador.
2. Edite textos e imagens.
3. Clique em **Salvar alterações** e selecione `site-config.json`.

O site lê os dados salvos em `site-config.json`.

## Imagens e resoluções ideais
O painel mostra a resolução ideal para cada imagem. Recomendações:
- Logo: 512 x 512 (1:1, fundo transparente)
- Hero: 1200 x 1500 (4:5)
- Hero (fundo): 1920 x 1200 (16:10)
- Sobre: 1600 x 1400
- Coleções: 900 x 1100
- Projetos: 1600 x 1000

> Para publicar, substitua também os arquivos dentro de `assets/img`.

## WhatsApp
Ajuste em `config.html`:
- Número com DDI
- Mensagem rápida
- Template do formulário (`{nome}`, `{tel}`, `{msg}`)

## Fontes
1. Adicione os arquivos `.woff2` em `assets/fonts/`.
2. Garanta os nomes conforme o `@font-face` em `styles.css`.

## Rodar local
Abra `index.html` no navegador.

Opcional (servidor local):
```bash
npx serve
```
