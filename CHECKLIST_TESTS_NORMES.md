# ✅ CHECKLIST TESTS - NORMES PROFESSIONNELLES

**Date**: 30 Octobre 2025
**Projet**: Hay Chess Tracker
**Objectif**: Vérifier TOUS les aspects avant production

---

## 🚨 TESTS DÉJÀ EFFECTUÉS (À NE PAS REFAIRE)

- ✅ Tests unitaires composants React (138 tests)
- ✅ Tests lib/parser.ts (14 tests)
- ✅ Tests lib/storage.ts (18 tests)
- ✅ Coverage unitaire: 95.81%

---

## ❌ TESTS NON EFFECTUÉS (OBLIGATOIRES)

### 1. BUILD & COMPILATION

#### 1.1 TypeScript Strict Build
- [ ] `npm run build` passe sans erreurs TypeScript
- [ ] Aucune erreur TS2339 (property does not exist)
- [ ] Aucune erreur TS2741 (missing property)
- [ ] Aucune erreur TS2353 (unknown properties)
- [ ] Types de tests corrects (@testing-library/jest-dom importé)

**CRITIQUE**: Tests passent mais build échoue = BLOQUANT PRODUCTION

#### 1.2 Vérification dist/
- [ ] Dossier `dist/` généré
- [ ] `dist/index.html` existe
- [ ] `dist/assets/*.js` générés
- [ ] `dist/assets/*.css` générés
- [ ] Taille bundle vérifiée (<1MB acceptable)

### 2. TESTS RUNTIME PRODUCTION

#### 2.1 Build Preview Local
- [ ] `npm run build` réussi
- [ ] `npm run preview` démarre
- [ ] App accessible http://localhost:4173
- [ ] Aucune erreur console navigateur
- [ ] Aucun warning React
- [ ] Hot reload fonctionne

#### 2.2 Fonctionnalités en Mode Production
- [ ] Créer événement → fonctionne
- [ ] Ajouter tournoi → fonctionne
- [ ] Sauvegarder → localStorage persist
- [ ] Reload page → données restaurées
- [ ] Onglets tournois → navigation OK
- [ ] Boutons disabled/enabled corrects

### 3. API PROXY VERCEL

#### 3.1 Tests API /api/scrape.ts
- [ ] POST request fonctionne
- [ ] GET request → 405 Method Not Allowed
- [ ] Body vide → 400 Bad Request
- [ ] URL invalide → 400 Bad Request
- [ ] URL non-FFE → 400 Bad Request
- [ ] Fetch timeout géré
- [ ] Erreur réseau gérée
- [ ] Headers CORS corrects
- [ ] Response 200 avec HTML

#### 3.2 Tests avec Mock Fetch
- [ ] Mock fetch réussi → retourne HTML
- [ ] Mock fetch 404 → erreur claire
- [ ] Mock fetch 500 → erreur serveur
- [ ] Mock timeout → erreur timeout

**CRITIQUE**: API non testée = risque CORS/fetch en prod

### 4. PARSER FFE AVEC VRAIES DONNÉES

#### 4.1 Vraies URLs FFE Récentes (CRITIQUE)
- [ ] Trouver 3-5 tournois FFE récents (Oct-Nov 2025)
- [ ] Tester Action=Ls (liste joueurs)
- [ ] Tester Action=Ga (grille américaine)
- [ ] Parser extrait joueurs correctement
- [ ] Parser extrait rondes correctement
- [ ] Parser extrait ELO correctement
- [ ] Filtrage club "Hay Chess" fonctionne
- [ ] Gestion joueurs sans ELO
- [ ] Gestion tournois incomplets
- [ ] Gestion HTML FFE variations

**CRITIQUE**: Parser JAMAIS testé avec vraies pages = RISQUE MAJEUR

#### 4.2 Edge Cases HTML FFE
- [ ] Joueur sans club
- [ ] Joueur sans ELO (affiche "-")
- [ ] Ronde avec forfait
- [ ] Tournoi avec 1 seule ronde
- [ ] Tournoi avec 15+ rondes
- [ ] HTML malformé (table incomplète)
- [ ] Caractères spéciaux noms (accents, tirets)

### 5. SÉCURITÉ

#### 5.1 Vulnérabilités npm
- [ ] `npm audit --production` → 0 vulnérabilités
- [ ] `npm audit` (dev) → documenter si >0
- [ ] Dépendances critiques à jour
- [ ] Aucune dépendance deprecated

#### 5.2 Validation Entrées
- [ ] XSS: Event name avec `<script>` → sanitisé
- [ ] XSS: Tournament name avec HTML → sanitisé
- [ ] URL injection: JavaScript URL → bloquée
- [ ] localStorage quota dépassé → gestion erreur

#### 5.3 Headers Sécurité
- [ ] Content-Security-Policy configuré
- [ ] X-Frame-Options présent
- [ ] X-Content-Type-Options présent

### 6. PERFORMANCE

#### 6.1 Bundle Size
- [ ] Bundle total < 1MB (warning si >500KB)
- [ ] Analyser avec `npm run build -- --mode production`
- [ ] Identifier plus gros chunks
- [ ] Vérifier tree-shaking actif

#### 6.2 Lighthouse (Production)
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 80
- [ ] SEO > 80
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### 7. COMPATIBILITÉ NAVIGATEURS

#### 7.1 Desktop
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (si Mac disponible)
- [ ] Edge (dernière version)

#### 7.2 Mobile
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Responsive design (320px → 1920px)
- [ ] Touch events fonctionnent

### 8. FICHIERS & ORGANISATION

#### 8.1 Fichiers Racine
- [ ] Lister tous fichiers racine
- [ ] Identifier fichiers tests (.test.tsx, .test.ts)
- [ ] Vérifier si tests doivent rester src/ ou aller tests/
- [ ] Supprimer fichiers temporaires (.log, .tmp, etc.)
- [ ] Vérifier .gitignore complet

#### 8.2 Fichiers Documentation
- [ ] README.md à jour
- [ ] CHANGELOG.md (si existe) à jour
- [ ] package.json version correcte
- [ ] LICENSE (si requis)

#### 8.3 Configuration
- [ ] vercel.json valide
- [ ] tsconfig.json strict mode
- [ ] vite.config.ts correct
- [ ] tailwind.config.js complet
- [ ] .eslintrc (si existe) cohérent

### 9. GIT & VERSIONING

#### 9.1 État Git
- [ ] `git status` propre (aucun fichier modifié non commité)
- [ ] Aucun fichier sensible (.env local, secrets)
- [ ] .gitignore à jour (node_modules, dist, .env, coverage)
- [ ] Tous commits suivent format professionnel
- [ ] Branche main/master propre

#### 9.2 Remote
- [ ] Remote GitHub configuré
- [ ] Push réussi
- [ ] Aucun conflit
- [ ] Historique propre (pas de commits WIP)

### 10. DÉPLOIEMENT VERCEL

#### 10.1 Pre-Deploy Checks
- [ ] Build local réussi
- [ ] Preview local fonctionne
- [ ] Aucune erreur build
- [ ] Environment variables (si requis) documentées

#### 10.2 Premier Déploiement
- [ ] Créer projet Vercel
- [ ] Connecter GitHub repo
- [ ] Configuration automatique détectée
- [ ] Build Vercel réussi
- [ ] URL preview générée
- [ ] Tester URL preview
- [ ] Promouvoir en production si OK

#### 10.3 Post-Deploy
- [ ] App accessible en prod
- [ ] Aucune erreur console
- [ ] API /api/scrape fonctionne
- [ ] localStorage fonctionne
- [ ] Performance acceptable
- [ ] Monitoring configuré (optionnel)

---

## 📊 MÉTRIQUES CIBLES

### Obligatoire (BLOQUANT)
- ✅ Build TypeScript: 0 erreurs
- ✅ Tests unitaires: 100% pass (138/138)
- ✅ npm audit production: 0 vulnérabilités critical/high
- ✅ Parser FFE: testé avec 3+ vraies URLs
- ✅ API /api/scrape: tests passent

### Recommandé (QUALITÉ)
- 🎯 Coverage: >80% (actuellement 95.81% ✅)
- 🎯 Lighthouse Performance: >80
- 🎯 Bundle size: <500KB
- 🎯 Compatibilité: Chrome + Firefox + Safari

---

## 🚨 ORDRE PRIORITAIRE

1. **CRITIQUE** (bloquer si échec):
   - Fix TypeScript build errors
   - Tests API /api/scrape
   - Tests parser avec vraies URLs FFE
   - Build production réussi

2. **IMPORTANT** (warning si échec):
   - Lighthouse performance >80
   - Compatibilité navigateurs desktop
   - Organisation fichiers racine

3. **OPTIONNEL** (amélioration continue):
   - Tests E2E Playwright
   - Bundle optimization
   - Monitoring production

---

## ✅ VALIDATION FINALE

**Avant de dire "C'EST PRÊT" :**

- [ ] Tous tests CRITIQUES passent
- [ ] Build production 0 erreurs
- [ ] App testée manuellement en preview
- [ ] Parser testé avec vraies données FFE
- [ ] API testée (au moins mocks)
- [ ] Documentation à jour
- [ ] Git propre et pushé
- [ ] Déploiement Vercel réussi
- [ ] URL production fonctionnelle

---

**Si UNE SEULE case CRITIQUE échoue → NE PAS DÉPLOYER**

**FIN CHECKLIST**
