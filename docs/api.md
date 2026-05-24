# API Reference — Simulado Provas

Base URL: `http://localhost:3000/api/questions`

---

## GET /api/questions/stats

Retorna o total de questões disponíveis por matéria.

**Resposta:**
```json
{
  "totalQuestions": 66,
  "bySubject": {
    "matematica": 18,
    "portugues": 38,
    "raciocinio_logico": 10
  }
}
```

---

## GET /api/questions/subjects

Lista todas as matérias disponíveis com ícone e contagem de questões.

**Resposta:**
```json
{
  "subjects": [
    {
      "id": "portugues",
      "label": "Português",
      "icon": "📝",
      "totalQuestions": 38
    },
    {
      "id": "matematica",
      "label": "Matemática",
      "icon": "🔢",
      "totalQuestions": 18
    }
  ]
}
```

---

## GET /api/questions

Lista questões com filtros opcionais.

**Query params:**

| Parâmetro    | Tipo   | Descrição                                              |
|--------------|--------|--------------------------------------------------------|
| `subject`    | string | Filtra por matéria (`portugues`, `matematica`, ...)    |
| `topic`      | string | Filtra por tópico (`crase`, `fracoes`, ...)            |
| `difficulty` | string | `easy`, `medium` ou `hard`                             |
| `style`      | string | `municipal_igecs`, `municipal_vunesp`, `municipal_generico` |
| `limit`      | number | Máximo de questões retornadas                          |

**Exemplos:**

```
GET /api/questions?subject=portugues
GET /api/questions?subject=portugues&topic=crase
GET /api/questions?subject=portugues&difficulty=easy&limit=5
GET /api/questions?subject=matematica&topic=fracoes
```

**Resposta:**
```json
{
  "count": 6,
  "questions": [
    {
      "id": "PT-CR-001",
      "subject": "portugues",
      "topic": "crase",
      "difficulty": "easy",
      "style": "municipal_igecs",
      "statement": "Assinale a alternativa correta quanto ao uso da crase.",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 1,
      "explanation": "Explicação...",
      "tags": ["crase", "preposicao"]
    }
  ]
}
```

---

## GET /api/questions/random

Retorna questões aleatórias para montar um simulado.

**Query params:**

| Parâmetro    | Tipo   | Padrão | Descrição                                            |
|--------------|--------|--------|------------------------------------------------------|
| `subjects`   | string | todas  | Lista separada por vírgula: `portugues,matematica`   |
| `perSubject` | number | `5`    | Quantas questões por matéria                         |
| `total`      | number | —      | Limite total de questões (aplicado após seleção)     |

**Exemplos:**

```
# 5 questões de cada matéria disponível (embaralhado)
GET /api/questions/random

# 3 questões de Português + 3 de Matemática
GET /api/questions/random?subjects=portugues,matematica&perSubject=3

# Máximo de 10 questões no total
GET /api/questions/random?subjects=portugues,matematica&perSubject=5&total=10
```

**Resposta:** mesmo formato de `GET /api/questions`.

---

## Estrutura de uma questão

```json
{
  "id":           "PT-CR-001",       // identificador único
  "subject":      "portugues",       // matéria
  "topic":        "crase",           // tópico dentro da matéria
  "difficulty":   "easy",            // easy | medium | hard
  "style":        "municipal_igecs", // estilo de banca
  "statement":    "Enunciado...",    // texto da questão
  "options":      ["A", "B", "C", "D"], // alternativas (0-indexed)
  "correctIndex": 1,                 // índice da alternativa correta
  "explanation":  "Comentário...",   // gabarito comentado
  "tags":         ["crase"]          // tags para filtragem/IA
}
```

**Valores de `difficulty`:**
- `easy` — conhecimento básico, questões diretas
- `medium` — exige interpretação ou aplicação de regra
- `hard` — caso especial, pegadinha ou combinação de conceitos

**Valores de `style`:**
- `municipal_igecs` — padrão IGECS
- `municipal_vunesp` — padrão VUNESP
- `municipal_generico` — banca genérica / estilo livre

---

## Códigos de erro

| Status | Situação                                  |
|--------|-------------------------------------------|
| `404`  | Matéria não encontrada                    |
| `500`  | Erro interno ao ler os arquivos JSON      |

**Formato do erro:**
```json
{ "error": "Matéria não encontrada: fisica" }
```
