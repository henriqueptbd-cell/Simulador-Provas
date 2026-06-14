# Simulado Provas — Documentação Técnica

> Referência completa da API, formato do banco de questões e guia para geração de conteúdo por IA.

---

## Sumário

1. [Estrutura do banco de questões](#1-estrutura-do-banco-de-questões)
2. [Formato de uma questão](#2-formato-de-uma-questão)
3. [Campo `style` — valores e convenção](#3-campo-style--valores-e-convenção)
4. [Metadados por arquivo (`_meta`)](#4-metadados-por-arquivo-_meta)
5. [Metadados por matéria (`_meta.json`)](#5-metadados-por-matéria-_metajson)
6. [Template para geração por IA](#6-template-para-geração-por-ia)
7. [API Reference](#7-api-reference)

---

## 1. Estrutura do banco de questões

```
src/bd/
  <materia>/                   ← pasta = id da matéria (ex: qualidade_software)
    _meta.json                 ← metadados da matéria (label, ícone, prefixo)
    <topico>.json              ← arquivo por tópico (ex: normas_e_padroes.json)
    <topico>.json
    ...
```

**Regras:**
- O nome da pasta é o `id` da matéria — use `snake_case`, sem acentos
- Cada arquivo de tópico = um assunto dentro da matéria
- O servidor descobre novos arquivos automaticamente na inicialização — nenhuma config manual necessária
- Adicionar pasta nova = nova matéria aparece na API e no site

---

## 2. Formato de uma questão

### Formato antigo (ainda suportado)
Arquivo contém um array direto de questões:
```json
[
  { "id": "...", "subject": "...", ... },
  { "id": "...", "subject": "...", ... }
]
```

### Formato novo (recomendado)
Arquivo contém um objeto com `_meta` no topo e `questions` como array:
```json
{
  "_meta": {
    "discipline": "engenharia_software_1",
    "discipline_label": "Engenharia de Software 1",
    "semester": 2,
    "exam": "p2",
    "exam_label": "P2",
    "courses": ["ADS", "SI", "CC"]
  },
  "questions": [
    { "id": "...", "subject": "...", ... }
  ]
}
```

Os campos do `_meta` são injetados automaticamente em cada questão pelo servidor.

---

## 3. Estrutura completa de uma questão

```json
{
  "id":           "QS-AU1-001",
  "subject":      "qualidade_software",
  "topic":        "qualidade_e_produtividade",
  "difficulty":   "medium",
  "style":        "fatec_ads",
  "statement":    "Texto da questão...",
  "options": [
    "Alternativa A",
    "Alternativa B",
    "Alternativa C",
    "Alternativa D"
  ],
  "correctIndex": 1,
  "explanation":  "Gabarito comentado explicando por que B está correta e por que as outras estão erradas.",
  "tags":         ["iso25010", "qualidade", "definicao"]
}
```

### Descrição dos campos

| Campo          | Tipo     | Obrigatório | Descrição |
|----------------|----------|-------------|-----------|
| `id`           | string   | Sim         | Identificador único. Padrão: `<PREFIXO>-<CODIGO>-<NUM>` |
| `subject`      | string   | Sim         | Id da pasta de matéria (ex: `qualidade_software`) |
| `topic`        | string   | Sim         | Id do tópico — deve bater com o nome do arquivo JSON |
| `difficulty`   | string   | Sim         | `easy`, `medium` ou `hard` |
| `style`        | string   | Sim         | Origem/estilo da questão (ver seção 3) |
| `statement`    | string   | Sim         | Enunciado completo da questão |
| `options`      | string[] | Sim         | Exatamente 4 alternativas |
| `correctIndex` | number   | Sim         | Índice (0–3) da alternativa correta |
| `explanation`  | string   | Sim         | Comentário do gabarito — explica o acerto E os erros |
| `tags`         | string[] | Sim         | Palavras-chave para busca e categorização |

### Valores de `difficulty`

| Valor    | Quando usar |
|----------|-------------|
| `easy`   | Definição direta, conceito isolado, questão de memorização |
| `medium` | Requer interpretação, comparação ou aplicação de regra |
| `hard`   | Caso especial, pegadinha, combinação de conceitos, múltiplas afirmações |

---

## 4. Campo `style` — valores e convenção

O campo `style` identifica a origem e o padrão da questão. Isso permite filtrar por tipo de prova.

### Para concursos públicos

| Valor               | Descrição |
|---------------------|-----------|
| `concurso_igecs`    | Banca IGECS (concursos municipais) |
| `concurso_vunesp`   | Banca VUNESP |
| `concurso_cespe`    | Banca CESPE/CEBRASPE (federal) |
| `concurso_fcc`      | Fundação Carlos Chagas |
| `concurso_generico` | Banca genérica / estilo livre |

> **Valores legados ainda em uso:** `municipal_igecs`, `municipal_vunesp`, `municipal_generico` — funcionam normalmente.

### Para questões acadêmicas (faculdade)

Padrão: `<instituicao>_<curso>`

| Valor               | Descrição |
|---------------------|-----------|
| `fatec_ads`         | FATEC — Análise e Desenvolvimento de Sistemas |
| `fatec_administracao` | FATEC — Administração |
| `usp_si`            | USP — Sistemas de Informação |
| `unicamp_cc`        | UNICAMP — Ciência da Computação |
| `generico_faculdade` | Estilo universitário genérico |

### Para vestibulares

| Valor              | Descrição |
|--------------------|-----------|
| `vestibular_enem`  | Estilo ENEM |
| `vestibular_fuvest`| FUVEST |
| `vestibular_generico` | Vestibular genérico |

**Regra geral para criar um valor novo:** `<contexto>_<especificacao>` em `snake_case`, sem acentos.

---

## 5. Metadados por arquivo (`_meta`)

Usado em arquivos no **formato novo**. Indica de onde as questões vieram.

```json
{
  "_meta": {
    "discipline":        "engenharia_software_1",
    "discipline_label":  "Engenharia de Software 1",
    "semester":          2,
    "exam":              "p2",
    "exam_label":        "P2",
    "courses":           ["ADS", "SI", "CC"]
  },
  "questions": [...]
}
```

| Campo              | Tipo     | Descrição |
|--------------------|----------|-----------|
| `discipline`       | string   | Id da disciplina (`snake_case`) |
| `discipline_label` | string   | Nome legível da disciplina |
| `semester`         | number   | Semestre do curso |
| `exam`             | string   | Id da prova (`p1`, `p2`, `final`, `sub`) |
| `exam_label`       | string   | Nome legível da prova |
| `courses`          | string[] | Cursos para os quais o conteúdo é relevante |

---

## 6. Metadados por matéria (`_meta.json`)

Cada pasta de matéria deve ter um `_meta.json`:

```json
{
  "label":  "Qualidade de Software",
  "icon":   "⚙️",
  "prefix": "QS"
}
```

| Campo    | Descrição |
|----------|-----------|
| `label`  | Nome legível exibido no site |
| `icon`   | Emoji representativo |
| `prefix` | 2–3 letras maiúsculas usadas nos IDs das questões |

---

## 7. Template para geração por IA

Use este prompt + template ao pedir questões para uma IA:

---

**Prompt sugerido:**

> Gere questões de múltipla escolha no formato JSON abaixo para a disciplina `[NOME DA DISCIPLINA]`, tópico `[NOME DO TÓPICO]`, estilo `[STYLE]`. Siga o template exatamente — 4 alternativas, sempre um `correctIndex` entre 0 e 3, `explanation` explicando o acerto E os erros das outras opções.

**Template:**

```json
{
  "_meta": {
    "discipline":        "nome_da_disciplina",
    "discipline_label":  "Nome da Disciplina",
    "semester":          1,
    "exam":              "p1",
    "exam_label":        "P1",
    "courses":           ["CURSO1", "CURSO2"]
  },
  "questions": [
    {
      "id":           "PREFIX-TOPICO-001",
      "subject":      "nome_da_materia",
      "topic":        "nome_do_topico",
      "difficulty":   "easy",
      "style":        "fatec_ads",
      "statement":    "Enunciado da questão?",
      "options": [
        "Alternativa incorreta.",
        "Alternativa CORRETA.",
        "Alternativa incorreta.",
        "Alternativa incorreta."
      ],
      "correctIndex": 1,
      "explanation":  "A alternativa B está correta porque [...]. A é errada pois [...]. C confunde [...]. D é errada porque [...].",
      "tags":         ["tag1", "tag2"]
    }
  ]
}
```

**Regras para a IA seguir:**
- `id` único, formato `PREFIX-CODIGO-NUM` (ex: `QS-AU1-001`, `ADM-MKT-003`)
- `subject` = nome da pasta de matéria (sem acentos, `snake_case`)
- `topic` = nome do arquivo de tópico (sem acentos, `snake_case`)
- `correctIndex` é o índice (0, 1, 2 ou 3) — não coloque a resposta sempre na mesma posição
- `explanation` deve citar por que cada alternativa está certa ou errada
- `tags` em `snake_case`, sem acentos
- Não inventar campos extras

---

## 8. API Reference

Base URL: `http://localhost:PORT/api/questions`

---

### GET /api/questions/stats

Retorna total de questões por matéria.

```json
{
  "totalQuestions": 101,
  "bySubject": {
    "portugues": 38,
    "matematica": 18,
    "qualidade_software": 35,
    "raciocinio_logico": 10
  }
}
```

---

### GET /api/questions/subjects

Lista matérias com label, ícone e contagem. Aceita filtros para retornar contagem filtrada.

**Query params opcionais:** `discipline`, `exam`, `difficulty`, `style`

```
GET /api/questions/subjects
GET /api/questions/subjects?discipline=engenharia_software_1
GET /api/questions/subjects?discipline=engenharia_software_1&exam=p2
GET /api/questions/subjects?style=fatec_ads&difficulty=medium
```

```json
{
  "subjects": [
    { "id": "qualidade_software", "label": "Qualidade de Software", "icon": "⚙️", "totalQuestions": 35 },
    { "id": "portugues", "label": "Língua Portuguesa", "icon": "📝", "totalQuestions": 38 }
  ]
}
```

---

### GET /api/questions/catalog

Retorna todas as disciplinas, provas e cursos presentes no banco — derivado automaticamente dos `_meta` dos arquivos.

```json
{
  "disciplines": [
    { "id": "engenharia_software_1", "label": "Engenharia de Software 1" }
  ],
  "exams": [
    { "id": "p2", "label": "P2" }
  ],
  "courses": ["ADS", "CC", "SI"]
}
```

---

### GET /api/questions/filters

Retorna valores únicos de `difficulty` e `style` presentes no banco.

```json
{
  "difficulties": ["easy", "medium", "hard"],
  "styles": ["fatec_ads", "municipal_igecs", "municipal_vunesp"]
}
```

---

### GET /api/questions

Lista questões com filtros opcionais.

**Query params:**

| Parâmetro    | Descrição |
|--------------|-----------|
| `subject`    | Id da matéria |
| `topic`      | Id do tópico |
| `difficulty` | `easy`, `medium` ou `hard` |
| `style`      | Ex: `fatec_ads`, `concurso_vunesp` |
| `discipline` | Id da disciplina (do `_meta`) |
| `exam`       | Id da prova (do `_meta`) |
| `limit`      | Máximo de questões retornadas |

```
GET /api/questions?subject=qualidade_software
GET /api/questions?subject=qualidade_software&topic=normas_e_padroes
GET /api/questions?discipline=engenharia_software_1&exam=p2
GET /api/questions?subject=portugues&difficulty=easy&limit=5
```

Cada questão retornada traz os campos do arquivo + campos injetados pelo servidor:
- `subjectLabel` — nome legível da matéria (do `_meta.json`)
- `subjectIcon` — emoji da matéria (do `_meta.json`)
- `discipline`, `exam`, `courses`, `semester` — do `_meta` do arquivo (quando presente)

---

### GET /api/questions/random

Retorna questões aleatórias. Aceita os mesmos filtros de `/api/questions`.

**Query params adicionais:**

| Parâmetro    | Padrão | Descrição |
|--------------|--------|-----------|
| `subjects`   | todas  | Lista por vírgula: `portugues,matematica` |
| `perSubject` | `5`    | Questões por matéria (máx. 20) |
| `total`      | —      | Limite total após seleção |

```
GET /api/questions/random
GET /api/questions/random?subjects=qualidade_software&perSubject=20
GET /api/questions/random?discipline=engenharia_software_1&exam=p2&total=10
```

---

### Códigos de erro

| Status | Situação |
|--------|----------|
| `404`  | Matéria não encontrada |
| `500`  | Erro interno ao ler os arquivos JSON |

```json
{ "error": "Matéria não encontrada: fisica" }
```
