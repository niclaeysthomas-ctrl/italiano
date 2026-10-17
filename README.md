# Italiano

Application web installable pour apprendre l'italien du niveau **A1** au niveau **C1**, pensée pour une pratique quotidienne sur téléphone.

- **Test de niveau adaptatif** au premier lancement (questions écrites et à écouter), qui fixe le niveau de départ.
- **Cartes à la Anki** : répétition espacée (algorithme de type SM-2, boutons À revoir / Difficile / Correct / Facile), deux sens par mot, ajout de ses propres mots.
- **Grammaire** : leçons courtes (règle, tableaux, exemples écoutables) et exercices corrigés (QCM, textes à trous).
- **Conjugaison** : 51 verbes, six temps (présent, passé composé, imparfait, futur, conditionnel, subjonctif présent), tableaux à écouter et séries d'entraînement.
- **Lecture du jour** : un texte par jour adapté au niveau, glossaire au toucher, traduction, questions de compréhension, mots à envoyer dans ses cartes.
- **Écoute** : synthèse vocale italienne partout, dictée avec correction mot à mot.
- **Traduction écrite** : phrases du français vers l'italien, correction mot à mot, indice, validation de sa propre traduction.
- **Oral** : répétition après le modèle avec reconnaissance vocale et score, enregistrement de sa voix pour se réécouter.
- **L'italien du quotidien** : 16 situations (bar, téléphone, SMS, réactions, petits mots de l'oral…), chacune avec un dialogue à écouter et une dizaine d'expressions expliquées ; une expression du jour sur l'accueil.
- **Lexique** : recherche dans tout le vocabulaire, fiche par mot avec son exemple et les autres phrases de l'application qui l'emploient.
- **Examen blanc** : 5 sujets (deux A1, deux A2, un B1) sur le modèle CILS — écoute (2 écoutes max), lecture, grammaire, écrit et oral — chronométrés, avec correction automatique et grille d'auto-évaluation pour l'écrit et l'oral.
- **Objectif quotidien** : barre de points sur l'accueil (1 par carte, 5 par exercice), objectif réglable.
- **Progression** : calendrier d'activité sur 12 semaines ; passage au niveau suivant suggéré quand mots, leçons et exercices du niveau sont acquis ; série de jours, statistiques, export et import de toutes les données.

Tout fonctionne hors ligne une fois chargé, sans compte : les données restent dans le navigateur de l'appareil.

## État actuel

Cette version pose **l'architecture complète** ; le contenu est un échantillon à enrichir.

| Partie | État |
| --- | --- |
| Moteurs (répétition espacée, test adaptatif, comparaison de phrases, contenu du jour) | Fonctionnels et testés |
| Écrans (accueil, test, cartes, grammaire, lecture, dictée, oral, profil) | Fonctionnels |
| Stockage local, export/import | Fonctionnel |
| Contenu | 670 cartes (mots, expressions et phrases entières, toutes avec un exemple traduit) dans 37 paquets ; 21 leçons de grammaire (A1 → C1), 20 lectures (quatre par niveau), 25 questions de test |

Limites connues, à garder en tête :

- **Voix** : la qualité de l'écoute dépend des voix italiennes installées sur l'appareil (synthèse du navigateur). Le contenu pourra plus tard pointer vers de vrais enregistrements.
- **Reconnaissance vocale** : disponible dans Chrome, Edge et Safari, pas dans Firefox. Dans Chrome, l'audio est transcrit par les serveurs de Google. Le score mesure l'intelligibilité, pas l'accent.
- **Données sur un seul appareil** : pas de synchronisation pour l'instant ; l'export JSON sert de sauvegarde.
- **Pas de `package-lock.json`** : le projet a été écrit dans un environnement sans accès au registre npm. Le premier `npm install` le créera ; il faudra alors le versionner.

## Démarrer

Prérequis : Node.js 22.18 ou plus récent.

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires et validation du contenu
npm run typecheck  # vérification TypeScript
npm run build      # version de production dans dist/
```

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` teste, compile et publie l'application à chaque push sur `main`.
Il faut l'activer une fois : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
L'application est alors disponible à `https://<utilisateur>.github.io/<depot>/` et s'installe sur l'écran d'accueil du téléphone depuis le navigateur.

## Organisation du code

```
src/
  core/        logique pure, sans navigateur, testée avec node:test
    srs/         répétition espacée (planificateur, file du jour)
    placement/   test de niveau adaptatif
    text/        comparaison de phrases, découpage
    daily/       contenu du jour déterministe
    practice/    réservoir de phrases pour la dictée et l'oral
    content/     types et validation du contenu
  content/     contenu pédagogique en JSON (+ index.ts)
  data/        stockage IndexedDB et accès aux données
  audio/       synthèse vocale, reconnaissance vocale, enregistrement
  features/    un dossier par écran
  ui/          composants partagés
  app/         routes, contexte, barre d'onglets
  styles/      feuille de style unique
public/        manifeste, service worker, icônes
docs/          architecture et guide du contenu
```

Pour aller plus loin : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) et [docs/CONTENU.md](docs/CONTENU.md).

## Feuille de route

1. Enrichir le contenu : paquets de cartes par thème et par niveau (objectif : plusieurs milliers de mots jusqu'au C1), leçons de grammaire couvrant tout le programme, une lecture par jour sur plusieurs mois.
2. Enregistrements audio réels pour le vocabulaire et les lectures.
3. Passage de la répétition espacée à FSRS (l'interface du planificateur est prévue pour).
4. Affiner la suggestion de niveau (aujourd'hui : 70 % des mots et des leçons, 75 % aux exercices).
5. Synchronisation optionnelle entre appareils.
