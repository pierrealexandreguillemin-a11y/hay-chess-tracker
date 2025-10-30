# 🧪 ROADMAP TESTS - HAY CHESS TRACKER

**Selon : `c:\Dev\chess-app\DIRECTIVE_RIGUEUR_CLAUDE_CODE_CHESS_APP.md`**

---

## 📊 ÉTAT ACTUEL (Brutal et Honnête)

### ✅ Tests Existants
```
✓ src/lib/parser.test.ts       - 14 tests, 96.9% couverture
✓ src/lib/storage.test.ts      - 18 tests, 91.37% couverture
TOTAL : 32 tests
```

### ❌ Couverture Réelle du Projet
```
Fichiers testés : 2 / ~30 fichiers
Couverture RÉELLE : ~20% (seulement lib/)
Objectif DIRECTIVE : >70% GLOBAL

ÉCART : -50 points de couverture
```

---

## 🎯 OBJECTIFS SELON LA DIRECTIVE

### Pyramide de Tests Obligatoire

```
        E2E (10%)
       /    \
    Integration (30%)
    /        \
Unit Tests (60%)
```

### Couverture Minimale par Type
| Type | Objectif | Actuel | Écart |
|------|----------|--------|-------|
| **Modèles de données** (types/) | 100% | 0% | -100% |
| **Services métier** (lib/) | 90% | 94% | ✅ +4% |
| **API endpoints** (api/) | 80% | 0% | -80% |
| **Composants UI critiques** | 70% | 0% | -70% |
| **Utilitaires** (utils) | 100% | N/A | N/A |

### Types de Tests Requis
- [x] Tests unitaires (Vitest) - PARTIEL
- [ ] Tests d'intégration (Supertest)
- [ ] Tests E2E (Cypress/Playwright)
- [ ] Tests de charge (K6/JMeter)
- [ ] Tests de sécurité (OWASP ZAP)
- [ ] Tests d'accessibilité (axe-core)

---

## 📋 PHASE 1 : TESTS UNITAIRES (60%) - CRITIQUE

### 1.1 Composants React Critiques (70% minimum)

#### A. App.tsx (CRITIQUE - Point d'entrée)
**Fichier à créer : `src/App.test.tsx`**

**Tests requis (minimum 15 tests) :**
- [ ] **Mount/Unmount**
  - Render sans crash
  - Appelle getCurrentEvent() au mount
  - Nettoie les effets au unmount

- [ ] **États initiaux**
  - currentEvent null → affiche empty state
  - currentEvent null → showEventForm = true
  - currentEvent exists → showEventForm = false

- [ ] **Navigation conditionnelle**
  - Avec event + showEventForm=false → affiche TournamentTabs
  - Avec event + showEventForm=true → affiche EventForm
  - Sans event + showEventForm=false → affiche empty state
  - Sans event + showEventForm=true → affiche EventForm

- [ ] **Actions utilisateur**
  - Click "Nouvel événement" → toggle showEventForm
  - Click "Annuler" → toggle showEventForm
  - handleEventCreated → save event + set current + hide form

- [ ] **Composants d'arrière-plan**
  - HalftoneWaves rendu
  - BackgroundPaths rendu
  - FloatingParticles rendu avec props correctes

**Couverture attendue : >70%**

---

#### B. EventForm.tsx (CRITIQUE - Création événements)
**Fichier à créer : `src/components/EventForm.test.tsx`**

**Tests requis (minimum 20 tests) :**
- [ ] **Render initial**
  - Formulaire vide au mount
  - Bouton submit désactivé si form invalide

- [ ] **Validation champs**
  - eventName requis (erreur si vide)
  - eventName min 3 caractères
  - Au moins 1 tournoi requis

- [ ] **Gestion tournois**
  - Ajouter tournoi → tableau updated
  - Supprimer tournoi → tableau updated
  - Tournoi sans nom → erreur
  - Tournoi sans URL → erreur
  - URL invalide (pas echecs.asso.fr) → erreur
  - URL doit contenir Action=Ga → erreur

- [ ] **Soumission**
  - Submit form valide → appelle onEventCreated
  - Submit form invalide → affiche erreurs
  - Event ID généré correctement (timestamp)
  - Tournaments IDs générés correctement

- [ ] **Edge cases**
  - Ajout 5+ tournois → scroll
  - Suppression dernier tournoi → validation
  - Caractères spéciaux dans nom
  - Très long nom d'événement

**Couverture attendue : >70%**

---

#### C. PlayerTable.tsx (CRITIQUE - Affichage résultats)
**Fichier à créer : `src/components/PlayerTable.test.tsx`**

**Tests requis (minimum 18 tests) :**
- [ ] **Render données**
  - Affiche tous les joueurs du tournoi
  - Affiche ELO correctement
  - Affiche classement correctement
  - Affiche points correctement

- [ ] **Résultats par ronde**
  - Icône victoire (✓) pour score=1
  - Icône défaite (✗) pour score=0
  - Icône nulle (=) pour score=0.5
  - Pas de résultat → affiche "-"

- [ ] **Validation rounds**
  - Checkbox validation par ronde
  - Check → sauvegarde dans localStorage
  - Uncheck → met à jour localStorage
  - État validation persisté après remount

- [ ] **Statistiques**
  - Buchholz affiché avec 1 décimale
  - Performance affichée
  - Badge classement affiché

- [ ] **Edge cases**
  - 0 joueurs → affiche "Aucun joueur"
  - Joueur avec 0 rondes → gère gracieusement
  - Très grand nombre de rondes (>10)

- [ ] **localStorage sync**
  - Validations chargées au mount
  - Validations mises à jour au changement tournoi
  - Nettoyage au unmount

**Couverture attendue : >70%**

---

#### D. TournamentTabs.tsx (CRITIQUE - Navigation)
**Fichier à créer : `src/components/TournamentTabs.test.tsx`**

**Tests requis (minimum 16 tests) :**
- [ ] **Render tabs**
  - Affiche tous les onglets tournois
  - Premier onglet sélectionné par défaut
  - Contenu tab actif affiché

- [ ] **Navigation**
  - Click tab → change active tab
  - Active tab highlighted
  - Contenu change selon tab

- [ ] **Fetch résultats**
  - Click "Actualiser" → fetch API scrape
  - Loading state pendant fetch
  - Succès → parse + affiche joueurs
  - Erreur → affiche message erreur
  - API appelée avec bonne URL (Action=Ls + Action=Ga)

- [ ] **ClubStats**
  - Stats calculées correctement
  - Stats mises à jour après fetch
  - Affichage conditionnel si joueurs

- [ ] **Edge cases**
  - 0 tournois → n'affiche rien
  - Fetch timeout → gère erreur
  - HTML FFE malformé → gère erreur
  - Pas de joueurs Hay Chess → affiche message

**Couverture attendue : >70%**

---

#### E. ClubStats.tsx
**Fichier à créer : `src/components/ClubStats.test.tsx`**

**Tests requis (minimum 8 tests) :**
- [ ] Affiche nombre de joueurs
- [ ] Affiche total points
- [ ] Affiche moyenne points
- [ ] Affiche ronde actuelle
- [ ] 0 joueurs → affiche stats vides
- [ ] Calculs corrects avec données réelles
- [ ] Arrondis corrects (2 décimales)
- [ ] Icônes affichées

**Couverture attendue : >70%**

---

### 1.2 API Endpoints (80% minimum)

#### F. api/scrape.ts
**Fichier à créer : `api/scrape.test.ts`**

**Tests requis (minimum 12 tests) :**
- [ ] **Validation requêtes**
  - Méthode POST uniquement
  - GET/PUT/DELETE → 405 Method Not Allowed
  - Body sans URL → 400 Bad Request
  - URL non-string → 400 Bad Request

- [ ] **Validation URL FFE**
  - URL non-FFE (google.com) → 400 Bad Request
  - URL FFE valide → acceptée
  - URL vide → 400 Bad Request

- [ ] **Fetch FFE**
  - Mock fetch réussi → retourne HTML
  - Mock fetch 404 → retourne 404 avec message
  - Mock fetch timeout → retourne 500
  - Headers User-Agent corrects

- [ ] **Gestion erreurs**
  - Exception fetch → 500 Internal Server Error
  - Erreur réseau → message approprié
  - Response non-ok → propagation status code

**Couverture attendue : >80%**

---

### 1.3 Composants UI Secondaires (optionnel mais recommandé)

#### G. MiamiGlass.tsx
**Fichier à créer : `src/components/common/MiamiGlass.test.tsx`**

**Tests requis (minimum 6 tests) :**
- [ ] Render avec children
- [ ] Variant "background" → styles corrects
- [ ] Variant "foreground" → styles corrects
- [ ] Shimmer true → render ShimmerEffect
- [ ] Shimmer false → render div
- [ ] Props spreading (...props)

---

## 📋 PHASE 2 : TESTS D'INTÉGRATION (30%)

### 2.1 Flux Complet Création Événement
**Fichier à créer : `src/integration/event-creation.integration.test.tsx`**

**Tests requis (minimum 8 tests) :**
- [ ] Flux complet : créer event → sauvegarder → afficher
- [ ] Créer event → ajouter tournoi → fetch résultats → afficher joueurs
- [ ] Créer event → valider résultats → sauvegarder localStorage
- [ ] Supprimer event → cleanup localStorage
- [ ] Multiple events → switch entre events
- [ ] Export data → import data → vérifier intégrité
- [ ] Event avec 0 tournois → gère gracieusement
- [ ] Event avec 10+ tournois → performance acceptable

---

### 2.2 Flux Parser FFE Complet
**Fichier à créer : `src/integration/ffe-parser.integration.test.tsx`**

**Tests requis (minimum 6 tests) :**
- [ ] Fetch Action=Ls → fetch Action=Ga → parse → filtre club
- [ ] Parser avec vraies fixtures HTML FFE
- [ ] Gestion erreur fetch API
- [ ] Gestion HTML FFE malformé
- [ ] Gestion 0 joueurs Hay Chess
- [ ] Calcul stats club après parsing

---

## 📋 PHASE 3 : TESTS E2E (10%)

### 3.1 Cypress/Playwright Setup
**Installation requise :**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Fichier config : `playwright.config.ts`**

---

### 3.2 Scénarios E2E
**Fichier à créer : `e2e/user-journey.spec.ts`**

**Tests requis (minimum 5 tests) :**
- [ ] **User Journey Complet**
  - Ouvrir app → créer event → ajouter tournoi → fetch résultats → valider rondes → export data

- [ ] **Navigation**
  - Switch entre tabs tournois
  - Ouvrir/fermer EventForm

- [ ] **Persistance**
  - Créer event → reload page → event toujours là
  - Valider rondes → reload → validations persistées

- [ ] **Erreurs utilisateur**
  - Submit form invalide → affiche erreurs
  - Fetch URL invalide → affiche erreur

- [ ] **Performance**
  - App charge en <3s
  - Interactions fluides (<100ms)

---

## 📋 PHASE 4 : TESTS NON-FONCTIONNELS

### 4.1 Tests de Charge (K6)
**Fichier à créer : `load-tests/api-scrape.k6.js`**

**Tests requis :**
- [ ] API /api/scrape supporte 100 req/s
- [ ] Temps réponse <500ms (P95)
- [ ] Taux erreur <1%

---

### 4.2 Tests de Sécurité (OWASP ZAP)
**Script à créer : `scripts/security-scan.sh`**

**Tests requis :**
- [ ] Scan vulnérabilités XSS
- [ ] Scan injections SQL (pas applicable ici)
- [ ] Scan headers sécurité
- [ ] Scan dépendances npm (npm audit)

---

### 4.3 Tests d'Accessibilité (axe-core)
**Fichier à créer : `src/accessibility.test.tsx`**

**Tests requis (minimum 5 tests) :**
- [ ] App.tsx passe axe-core
- [ ] EventForm passe axe-core (labels, ARIA)
- [ ] PlayerTable passe axe-core (table headers)
- [ ] Contraste couleurs WCAG AA
- [ ] Navigation clavier complète

---

## 📊 MÉTRIQUES CIBLES

### Couverture Finale Attendue

| Fichier/Type | Actuel | Cible | Tests à Ajouter |
|--------------|--------|-------|-----------------|
| **lib/parser.ts** | 96.9% | 100% | +2 tests edge cases |
| **lib/storage.ts** | 91.37% | 100% | +4 tests error handling |
| **App.tsx** | 0% | 70% | +15 tests |
| **EventForm.tsx** | 0% | 70% | +20 tests |
| **PlayerTable.tsx** | 0% | 70% | +18 tests |
| **TournamentTabs.tsx** | 0% | 70% | +16 tests |
| **ClubStats.tsx** | 0% | 70% | +8 tests |
| **api/scrape.ts** | 0% | 80% | +12 tests |
| **MiamiGlass.tsx** | 0% | 60% | +6 tests |
| **Integration** | 0% | N/A | +14 tests |
| **E2E** | 0% | N/A | +5 tests |
| **Accessibilité** | 0% | N/A | +5 tests |
| **TOTAL** | **32 tests** | **~153 tests** | **+121 tests** |

### Couverture Globale
```
Actuel  : ~20% (2/30 fichiers)
Cible   : >70% (tous fichiers)
Écart   : +121 tests à écrire
Temps   : 15-20 heures de travail
```

---

## 🚨 BLOQUANTS CRITIQUES

### Tests Manquants Critiques (DOIT être fait avant production)
1. ❌ **Parser FFE avec vraies URLs FFE** - CRITIQUE
   - Risque : App peut échouer silencieusement en prod
   - Temps : 2-3h

2. ❌ **Tests API /api/scrape** - CRITIQUE
   - Risque : CORS/fetch peut échouer en prod
   - Temps : 2h

3. ❌ **Tests composants React** - BLOQUANT
   - Risque : Bugs UX non détectés
   - Temps : 8-10h

4. ❌ **Tests E2E user journey** - IMPORTANT
   - Risque : Flux utilisateur cassé
   - Temps : 3-4h

### Tests Recommandés (Qualité professionnelle)
5. ⚠️ Tests d'accessibilité (WCAG AA) - Temps : 2h
6. ⚠️ Tests de charge API - Temps : 2h
7. ⚠️ Tests de sécurité OWASP - Temps : 1h

---

## ✅ CHECKLIST DE VALIDATION

**Avant de dire "Tests terminés" :**

- [ ] `npm test` → TOUS les tests passent (0 failed)
- [ ] `npm run test:coverage` → **Couverture globale > 70%**
- [ ] Couverture parser.ts : 100%
- [ ] Couverture storage.ts : 100%
- [ ] Couverture API scrape.ts : >80%
- [ ] Couverture composants critiques : >70%
- [ ] Tests E2E passent
- [ ] Tests accessibilité passent
- [ ] Aucun test skip ou .only
- [ ] Aucun console.log dans les tests
- [ ] Tous les mocks correctement nettoyés (afterEach)
- [ ] Documentation tests à jour

---

## 🎯 PLAN D'EXÉCUTION PROPOSÉ

### Sprint 1 : Tests Critiques (8h)
- Jour 1 : App.tsx + EventForm.tsx tests (4h)
- Jour 2 : PlayerTable.tsx + TournamentTabs.tsx tests (4h)

### Sprint 2 : Tests API + Intégration (6h)
- Jour 3 : api/scrape.ts tests (2h)
- Jour 4 : Tests intégration (4h)

### Sprint 3 : Tests E2E + Non-Fonctionnels (6h)
- Jour 5 : Setup Playwright + E2E tests (3h)
- Jour 6 : Accessibilité + Sécurité (3h)

**TOTAL : 20 heures**

---

## 🚀 COMMANDES UTILES

```bash
# Lancer tous les tests
npm test

# Lancer tests en mode watch
npm test -- --watch

# Lancer tests avec UI
npm run test:ui

# Lancer coverage
npm run test:coverage

# Lancer tests E2E (après setup Playwright)
npx playwright test

# Lancer tests accessibilité
npm run test:a11y

# Lancer tous les checks
npm run test && npm run lint && npm run build
```

---

**STATUS : ROADMAP COMPLÈTE ET HONNÊTE**

**Prochaine étape : Exécuter cette roadmap étape par étape, SANS mentir sur les résultats.**
