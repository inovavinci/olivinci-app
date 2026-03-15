# Olimpíada Escolar (React + Vite)

## Publicar na web usando apenas o GitHub (GitHub Pages)

Este projeto está preparado para deploy em GitHub Pages:
- Rotas funcionam com `HashRouter` (ex.: `/#/dashboard`), evitando erros 404 em URLs diretas.
- `vite.config.js` usa `base: './'` para funcionar em subpastas do GitHub Pages.
- Um workflow de GitHub Actions faz build e publica automaticamente.

### 1) Ativar o GitHub Pages

No seu repositório no GitHub:
- Vá em `Settings` → `Pages`
- Em `Build and deployment`, selecione `Source: GitHub Actions`

### 2) Publicar (primeira vez)

Faça commit e push para `main` ou `master`.

Sempre que você der `git push`, o GitHub Actions vai:
- Rodar `npm ci`
- Rodar `npm run build`
- Publicar o conteúdo da pasta `dist` no GitHub Pages

### 3) Link do site

O endereço final costuma ser:
`https://SEU_USUARIO.github.io/NOME_DO_REPO/`

## Desenvolvimento local

```bash
npm install
npm run dev
```
