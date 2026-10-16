# Ajouter du contenu

Tout le contenu se trouve dans `src/content/`. Pour ajouter un fichier :

1. le créer dans le bon dossier en suivant le format ci-dessous ;
2. l'importer dans `src/content/index.ts` et l'ajouter à la liste correspondante ;
3. lancer `npm test` : la structure de chaque fichier est vérifiée (champs obligatoires, niveaux, index des bonnes réponses, identifiants uniques, termes du glossaire présents dans le texte).

Les niveaux valides sont `A1`, `A2`, `B1`, `B2`, `C1`. Les identifiants doivent rester stables : la progression de la personne y est rattachée.

## Paquet de cartes — `decks/*.json`

```json
{
  "id": "a2-cuisine",
  "title": "En cuisine",
  "level": "A2",
  "description": "Ustensiles, recettes et verbes de cuisine.",
  "notes": [
    {
      "id": "a2-pentola",
      "it": "la pentola",
      "fr": "la casserole",
      "example": "Metti l'acqua nella pentola.",
      "exampleFr": "Mets l'eau dans la casserole."
    }
  ]
}
```

- `id` de note unique dans **tous** les paquets ; préfixer par le niveau aide.
- `example` et `exampleFr` vont ensemble. Les exemples alimentent aussi la dictée et l'oral.
- Un champ `level` sur une note remplace celui du paquet.

## Leçon de grammaire — `grammar/*.json`

```json
{
  "id": "a2-imperfetto",
  "level": "A2",
  "order": 2,
  "title": "L'imparfait : imperfetto",
  "summary": "Décrire le passé et les habitudes.",
  "blocks": [
    { "type": "p", "text": "Paragraphe d'explication." },
    { "type": "rule", "text": "Règle mise en avant." },
    { "type": "tip", "text": "Astuce ou piège." },
    { "type": "table", "caption": "Titre", "head": ["Personne", "parlare"], "rows": [["io", "parlavo"]] },
    { "type": "examples", "items": [{ "it": "Da bambino giocavo a calcio.", "fr": "Enfant, je jouais au foot." }] }
  ],
  "exercises": [
    { "id": "e1", "type": "choice", "prompt": "Complète.", "text": "Ieri ___ bel tempo.", "options": ["faceva", "ha fatto"], "answer": 0, "explanation": "…" },
    { "id": "e2", "type": "cloze", "prompt": "Conjugue essere.", "text": "Da piccolo ___ timido.", "answers": ["ero"], "explanation": "…" }
  ]
}
```

- `order` fixe l'ordre des leçons dans un niveau ; la page d'accueil propose la première leçon non réussie (score ≥ 70 %).
- Dans un tableau, la première colonne est considérée comme française, les autres comme italiennes (affichées en Palatino).
- Exercice à trous : le texte contient `___` ; `answers` liste toutes les réponses acceptées. Majuscules, ponctuation et apostrophes typographiques sont ignorées ; un accent manquant compte pour moitié.

## Lecture — `readings/*.json`

```json
{
  "id": "a2-al-mercato",
  "level": "A2",
  "title": "Al mercato",
  "text": "Premier paragraphe.\n\nDeuxième paragraphe.",
  "translation": "Traduction du premier paragraphe.\n\nTraduction du deuxième.",
  "glossary": [{ "term": "bancarella", "fr": "l'étal" }],
  "questions": [{ "q": "Question en français ?", "options": ["A", "B", "C"], "answer": 1 }]
}
```

- Paragraphes séparés par une ligne vide ; la traduction suit le même découpage.
- Chaque `term` du glossaire doit apparaître tel quel dans le texte (il y devient touchable).
- La lecture du jour est tirée parmi les lectures du niveau de la personne, de façon stable pour une date donnée : plus il y a de lectures par niveau, plus la rotation est longue.

## Test de niveau — `placement/questions.json`

```json
{ "id": "pl-b1-6", "level": "B1", "skill": "grammar", "prompt": "Complète.", "text": "Spero che ___ bel tempo.", "options": ["faccia", "fa", "farà", "faceva"], "answer": 0 }
```

- `skill` : `grammar`, `vocab`, `reading` ou `listening`. Une question d'écoute a un champ `audio` (texte lu, non affiché) à la place de `text`.
- Il faut au moins 4 questions par niveau ; davantage permet de varier les tests successifs.
- Varier la position de la bonne réponse.
