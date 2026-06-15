# Template de Questões — Simulado Provas

Gere questões de múltipla escolha no formato JSON abaixo. Siga as regras à risca.

---

## Formato do arquivo

```json
{
  "_meta": {
    "discipline":        "nome_da_disciplina",
    "discipline_label":  "Nome Legível da Disciplina",
    "semester":          2,
    "exam":              "p2",
    "exam_label":        "P2",
    "courses":           ["DSM"]
  },
  "questions": [
    {
      "id":           "PREFIX-TOPICO-001",
      "subject":      "nome_da_materia",
      "topic":        "nome_do_topico",
      "difficulty":   "easy",
      "style":        "fatec_dsm",
      "statement":    "Enunciado da questão?",
      "options": [
        "Alternativa A.",
        "Alternativa B.",
        "Alternativa C.",
        "Alternativa D."
      ],
      "correctIndex": 1,
      "explanation":  "B está correta porque [...]. A é errada pois [...]. C confunde [...]. D é errada porque [...].",
      "tags":         ["tag1", "tag2"]
    }
  ]
}
```

---

## Regras obrigatórias

- **4 alternativas sempre** — nem mais, nem menos
- **`correctIndex`** é o índice da correta (0, 1, 2 ou 3) — varie a posição entre as questões, não deixe sempre na mesma
- **`explanation`** deve explicar por que a correta está certa E por que cada errada está errada
- **`id`** único, formato `PREFIX-CODIGO-NUM` — ex: `QS-AU1-001`, `ADM-MKT-003`
- **`subject`** = nome da pasta da matéria (`snake_case`, sem acentos)
- **`topic`** = nome do arquivo do tópico (`snake_case`, sem acentos)
- **`tags`** em `snake_case`, sem acentos
- Não inventar campos além dos listados

### Formatação do enunciado (`statement`)

O campo `statement` suporta `\n` para quebra de linha — use sempre que o enunciado tiver listas, afirmações numeradas ou colunas de associação.

**Questão com afirmações (I, II, III, IV):**
```json
"statement": "Analise as afirmações e marque a CORRETA:\n\nI. Afirmação um.\nII. Afirmação dois.\nIII. Afirmação três.\nIV. Afirmação quatro."
```

**Questão de associação (1–4 com A–D):**
```json
"statement": "Associe corretamente os itens:\n\n1. Item um\n2. Item dois\n3. Item três\n4. Item quatro\n\nA. Descrição A.\nB. Descrição B.\nC. Descrição C.\nD. Descrição D."
```

**Regra:** sempre uma linha em branco (`\n\n`) separando o enunciado dos itens, e entre os dois grupos de associação.

---

## Valores de `difficulty`

| Valor    | Quando usar |
|----------|-------------|
| `easy`   | Definição direta, conceito isolado, memorização |
| `medium` | Requer interpretação, comparação ou aplicação de regra |
| `hard`   | Pegadinha, combinação de conceitos, múltiplas afirmações |

---

## Valores de `style`

**Faculdade** → `<instituicao>_<curso>`
- `fatec_dsm` — FATEC / DSM ← **padrão para este projeto**
- `fatec_ads` — FATEC / ADS
- `fatec_administracao` — FATEC / Administração
- `usp_si` — USP / Sistemas de Informação
- `generico_faculdade` — universitário genérico

**Concurso público** → `concurso_<banca>`
- `concurso_igecs`, `concurso_vunesp`, `concurso_cespe`, `concurso_fcc`, `concurso_generico`

**Vestibular** → `vestibular_<nome>`
- `vestibular_enem`, `vestibular_fuvest`, `vestibular_generico`

---

## Campos do `_meta`

| Campo              | Descrição |
|--------------------|-----------|
| `discipline`       | Id da disciplina em `snake_case` (ex: `engenharia_software_1`) |
| `discipline_label` | Nome legível (ex: `"Engenharia de Software 1"`) |
| `semester`         | Semestre do curso (número) |
| `exam`             | Id da prova: `p1`, `p2`, `final`, `sub`, `vestibular`, `enem` |
| `exam_label`       | Nome legível da prova (ex: `"P2"`, `"Prova Final"`) |
| `courses`          | Cursos que aproveitam o conteúdo — para este projeto use `["DSM"]` |
