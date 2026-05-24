# Arquitetura — Simulado Provas

## Visão Geral

```
Navegador
  │
  ├── GET /                  → index.html   (home)
  ├── GET /simulado          → simulado.html
  ├── GET /resultado         → resultado.html
  │
  └── GET /api/questions/*   → Express (src/routes/questions.js)
                                        │
                                        └── loader.js → src/bd/**/*.json
```

O frontend é **100% estático** (HTML + CSS + JS puro). O backend Express tem dois papéis:
1. Servir os arquivos estáticos de `public/`
2. Expor a API REST que entrega as questões

Não há banco de dados — as questões vivem em arquivos JSON.

---

## Camada Backend (`src/`)

### `server.js`

Ponto de entrada. Configura:
- `express.static('public/')` — serve CSS, JS e demais assets
- Rotas de página (`/`, `/simulado`, `/resultado`) — entregam os HTMLs de `public/pages/`
- `app.use('/api/questions', ...)` — monta o router de questões

Lê a variável de ambiente `PORT` (padrão: 3000) — compatível com Railway, Render, etc.

### `utils/loader.js`

Responsável por ler os arquivos JSON do banco de questões.

- Varre os subdiretórios de `src/bd/`
- Faz cache em memória (`const cache = {}`) após a primeira leitura
- Exporta: `loadSubject(subject)`, `loadAll()`, `getSubjectDirs()`, `getStats()`

**Cache:** O servidor carrega cada matéria uma vez e guarda em memória. Para recarregar questões após editar um JSON, reinicie o servidor.

### `routes/questions.js`

Define os endpoints da API. Ver [`docs/api.md`](api.md) para documentação completa.

---

## Camada Frontend (`public/`)

Todos os arquivos JS usam **ES Modules nativos** (`type="module"`) — sem bundler, sem build step. Funciona em qualquer navegador moderno.

### Fluxo entre páginas

```
index.html
  │  (1) usuário clica em modo
  │  (2) home.js salva configuração em localStorage (key: sp_config)
  │
  └─→ simulado.html
        │  (3) simulado.js lê sp_config, busca questões na API
        │  (4) exibe prova, usuário responde
        │  (5) ao finalizar, salva resultado em localStorage (key: sp_result)
        │
        └─→ resultado.html
              (6) resultado.js lê sp_result, exibe score + revisão
              (7) salva no histórico (key: sp_history, máx. 5 itens)
```

### Módulos JS compartilhados

| Arquivo       | Responsabilidade                                          |
|---------------|-----------------------------------------------------------|
| `api.js`      | Funções `fetch` para os endpoints da API                  |
| `storage.js`  | Leitura/escrita no `localStorage` (config, result, history) |
| `timer.js`    | Classe `Timer` — start, pause, resume, format            |
| `quiz.js`     | Funções puras: shuffle, prepareQuestion, calculateResult, labels |

### Estrutura de dados no localStorage

**`sp_config`** — configuração do simulado a ser iniciado:
```json
{
  "mode": "full",
  "subjects": ["portugues", "matematica", "raciocinio_logico"],
  "perSubject": 5,
  "timed": true,
  "duration": 3600
}
```

**`sp_result`** — resultado do último simulado (usado por resultado.html):
```json
{
  "date": "2026-05-24T10:30:00.000Z",
  "mode": "full",
  "byTimer": false,
  "timeUsed": 1234,
  "config": { ... },
  "score": {
    "correct": 12,
    "total": 15,
    "percentage": 80,
    "details": [
      {
        "question": { ... },
        "userAnswer": 2,
        "isCorrect": true
      }
    ]
  }
}
```

**`sp_history`** — array com os últimos 5 resultados (mesmo formato de `sp_result`).

---

## Banco de Questões (`src/bd/`)

```
src/bd/
├── portugues/
│   ├── interpretacao.json
│   ├── crase.json
│   ├── concordancia.json
│   ├── pontuacao.json
│   ├── regencia.json
│   ├── classes_gramaticais.json
│   └── ortografia.json
├── matematica/
│   ├── operacoes.json
│   ├── porcentagem.json
│   ├── regra_de_tres.json
│   └── fracoes.json
└── raciocinio_logico/
    ├── proposicoes.json
    └── sequencias.json
```

Cada arquivo é um **array JSON** de questões. O `loader.js` combina todos os arquivos de uma pasta em um único array ao carregar a matéria.

### Padrão de IDs

```
{SIGLA}-{TOPICO}-{NUMERO}

PT-IN-001  → Português, Interpretação, questão 001
PT-CR-001  → Português, Crase
PT-CO-001  → Português, Concordância
MT-OP-001  → Matemática, Operações
RL-PR-001  → Raciocínio Lógico, Proposições
FI-ME-001  → Física, Mecânica (futuro)
```

### Como adicionar nova matéria

```bash
# 1. Criar pasta
mkdir src/bd/fisica

# 2. Criar arquivo de questões
# src/bd/fisica/mecanica.json
```

```json
[
  {
    "id": "FI-ME-001",
    "subject": "fisica",
    "topic": "mecanica",
    "difficulty": "medium",
    "style": "municipal_igecs",
    "statement": "Enunciado da questão...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Explicação...",
    "tags": ["mecanica", "forca"]
  }
]
```

```json
// 3. Atualizar src/index.json
{
  "subjects": [
    ...,
    {
      "id": "fisica",
      "topics": ["mecanica", "termodinamica", "optica"]
    }
  ]
}
```

A nova matéria aparece automaticamente na home e no simulado.

---

## Estilos CSS

Toda a estilização está em `public/assets/css/main.css`, organizado em seções:

- Custom Properties (variáveis de cor, tipografia, sombra)
- Reset + base
- Botões, badges, cards — componentes reutilizáveis
- Seções da Home (hero, stats, matérias, como funciona, histórico)
- Exam header + questão + navegação
- Resultado (score circle, breakdown, revisão)
- Media queries (responsivo)

**Paleta principal:**
```css
--green-700: #2d6a4f   /* cor primária */
--gold-500:  #c8963e   /* destaque/CTAs */
--bg:        #faf9f6   /* fundo aquecido */
```

---

## AdSense

Placeholders já inseridos em dois locais de cada página:
- **Banner horizontal** (728×90) — logo abaixo do header
- **Retângulo** (300×250 ou 336×280) — entre seções

Para ativar, substitua os blocos:

```html
<!-- Inserir código Google AdSense aqui -->
<div class="ad-placeholder">Publicidade</div>
```

Pelo snippet fornecido pelo AdSense. A classe `.ad-placeholder` pode ser removida quando o AdSense estiver ativo.

---

## Deploy

### Railway / Render

1. Suba o repositório para o GitHub
2. Conecte o repositório na plataforma
3. Start command: `npm start`
4. A porta é configurada automaticamente via `process.env.PORT`

### Variáveis de ambiente

| Variável | Padrão | Descrição                  |
|----------|--------|----------------------------|
| `PORT`   | `3000` | Porta do servidor HTTP     |

Não há outras variáveis necessárias para o funcionamento básico.
