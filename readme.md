# 📚 Simulado Provas

Plataforma de simulados gratuitos para concursos municipais. Questões de Português, Matemática e Raciocínio Lógico no estilo das principais bancas (IGECS, VUNESP, genéricas).

---

## Funcionalidades

- **Simulado Completo** — cronômetro de 60 minutos, questões aleatórias de todas as matérias
- **Praticar por Matéria** — todas as questões de uma matéria, sem limite de tempo
- **Gabarito comentado** — revisão de cada questão com explicação após o simulado
- **Histórico** — últimos 5 resultados salvos no navegador
- **Design responsivo** — funciona em desktop e celular

---

## Tecnologias

| Camada     | Tecnologia                            |
|------------|---------------------------------------|
| Backend    | Node.js + Express                     |
| Frontend   | HTML5 + CSS3 + JavaScript ES Modules  |
| Dados      | Arquivos JSON (banco de questões)     |
| Persistência | localStorage (sem login necessário) |

---

## Como Rodar

### Pré-requisitos
- Node.js 18+

### Instalação

```bash
npm install
npm start
```

Acesse `http://localhost:3000`

### Desenvolvimento (com reload automático)

```bash
npm run dev
```

---

## Estrutura do Projeto

```
Simulado-provas/
│
├── src/                          # Backend (Node.js)
│   ├── server.js                 # Entrada do servidor Express
│   ├── routes/
│   │   └── questions.js          # API REST /api/questions
│   ├── utils/
│   │   └── loader.js             # Carrega e cacheia os JSONs
│   ├── bd/                       # Banco de questões
│   │   ├── portugues/            # ← questões em JSON por tópico
│   │   ├── matematica/
│   │   └── raciocinio_logico/
│   └── index.json                # Catálogo de matérias e tópicos
│
├── public/                       # Frontend (estático)
│   ├── pages/
│   │   ├── index.html            # Home
│   │   ├── simulado.html         # Tela de prova
│   │   └── resultado.html        # Resultado e revisão
│   └── assets/
│       ├── css/main.css          # Todos os estilos
│       └── js/
│           ├── api.js            # Chamadas à API
│           ├── storage.js        # localStorage
│           ├── timer.js          # Cronômetro
│           ├── quiz.js           # Engine de questões
│           ├── home.js           # Lógica da home
│           ├── simulado.js       # Lógica da prova
│           └── resultado.js      # Lógica do resultado
│
├── docs/                         # Documentação
│   ├── arquitetura.md
│   └── api.md
│
├── package.json
└── readme.md
```

---

## Banco de Questões

Cada arquivo JSON dentro de `src/bd/{materia}/` contém um array de questões com este formato:

```json
{
  "id": "PT-CR-001",
  "subject": "portugues",
  "topic": "crase",
  "difficulty": "easy",
  "style": "municipal_igecs",
  "statement": "Assinale a alternativa correta quanto ao uso da crase.",
  "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "correctIndex": 1,
  "explanation": "Explicação detalhada da resposta correta.",
  "tags": ["crase", "preposicao"]
}
```

### Adicionar nova matéria

1. Crie a pasta `src/bd/{nome_da_materia}/`
2. Adicione arquivos `.json` com as questões (um arquivo por tópico)
3. Adicione a matéria ao catálogo em `src/index.json`
4. O servidor carrega automaticamente — sem reiniciar

### Matérias disponíveis

| ID                | Questões | Tópicos                                                            |
|-------------------|----------|--------------------------------------------------------------------|
| `portugues`       | 38       | interpretacao, crase, concordancia, pontuacao, regencia, classes_gramaticais, ortografia |
| `matematica`      | 18       | operacoes, porcentagem, regra_de_tres, fracoes                     |
| `raciocinio_logico` | 10     | proposicoes, sequencias                                            |

---

## Deploy (produção)

O projeto está pronto para Railway, Render ou qualquer plataforma que suporte Node.js.

1. Crie o repositório e faça push
2. Na plataforma, aponte o comando de start: `npm start`
3. A variável `PORT` é lida automaticamente do ambiente

```bash
# Railway
railway up

# Render: configure Start Command como "npm start"
```

---

## Monetização (AdSense)

Os placeholders já estão inseridos nas páginas. Para ativar:

1. Crie sua conta no [Google AdSense](https://www.google.com/adsense/)
2. Obtenha o código de anúncio
3. Substitua os blocos `<!-- Inserir código Google AdSense aqui -->` em:
   - `public/pages/index.html` (banner superior + retângulo)
   - `public/pages/resultado.html` (retângulo)

---

## Contribuição / Expansão

Para adicionar questões de novas matérias (Física, Biologia, Química, etc.):

1. Crie `src/bd/fisica/mecanica.json`
2. Siga o padrão de ID: `FI-ME-001` (matéria-tópico-número)
3. Adicione a matéria no `src/index.json`

Veja a documentação completa em [`docs/arquitetura.md`](docs/arquitetura.md).
