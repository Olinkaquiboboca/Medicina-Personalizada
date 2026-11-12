# Medicina personalizada · GitHub Pages

Este repositório contém apenas os arquivos necessários para publicar o site estático.
O único HTML na raiz é `index.html`; as demais páginas ficam organizadas em `pages/` e `exposicao/`.

## Publicação no GitHub Pages

1. Extraia o ZIP e envie **o conteúdo** para a raiz do repositório (não coloque tudo dentro de uma segunda pasta).
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch `main` e a pasta `/(root)`, depois salve.
5. Aguarde a publicação e abra o endereço fornecido pelo GitHub Pages.

Não há etapa de build nem dependências: é um site HTML, CSS e JavaScript estático. Os caminhos foram organizados para funcionar tanto em `usuario.github.io` quanto em `usuario.github.io/nome-do-repositorio/`.

## Estrutura

```text
index.html                  # Página inicial e ponto de entrada
pages/                      # Páginas da vitrine da feira
  vitrine.html
  feira.html
  equipe.html
  galeria.html
  videos.html
  informacoes.html
  referencias.html
exposicao/                   # Área científica
  index.html                # Mapa dos núcleos
  nucleos/nucleo-01.html    # Primeiro núcleo
assets/                     # CSS, JavaScript e imagens científicas
data/                       # Catálogos e configurações JSON
credits/                    # Créditos e licenças das figuras
media/                      # Mídias reais da feira
  galeria/
  videos/
```

## Atualização de conteúdo

- `data/event.json`: dados do evento.
- `data/team.json`: integrantes e funções.
- `data/media.json`: registros da galeria e vídeos.
- `data/site-config.json`: configuração de entrega de mídia/Cloudinary.
- `credits/ASSET_CREDITS.csv`: créditos e licenças das imagens incluídas.
- `assets/images/`: figuras científicas já utilizadas no site.
- `media/galeria/` e `media/videos/`: espaço para arquivos locais da feira.

Para mídias maiores, prefira URLs HTTPS de um serviço de entrega apropriado em vez de arquivos grandes no repositório. Nunca publique API Secret, tokens ou credenciais no GitHub.
