# 🔍 FFE HTML STRUCTURE - REFERENCE COMPLET

## 🎯 OBJECTIF
Documentation de la structure HTML RÉELLE des pages FFE après analyse approfondie.

## 📄 PAGE 1: LISTE DES JOUEURS (`listeLicencies.php?idclub=...`)
URL: https://ffe.echecs.asso.fr/ffe-front/ListeLicencies/listeLicencies.php?idclub=R54038

### Structure Table
```html
<table>
  <tr class="header-row">
    <td>Licence</td>
    <td>Nom</td>
    <td>ELO</td>
    <td>Détails</td>
  </tr>
  <tr class="data-row">
    <td>A54038xxx</td>           <!-- Cell[0] -->
    <td>NOM Prénom</td>          <!-- Cell[1] -->
    <td>1234</td>                <!-- Cell[2] -->
    <td><a href="...">Détails</a></td>
  </tr>
</table>
```

**INDICES CORRECTS:**
- `Cell[0]` = Licence
- `Cell[1]` = Nom complet
- `Cell[2]` = ELO
- `Cell[3]` = Lien détails

---

## 📄 PAGE 2: RÉSULTATS JOUEUR (`GrillesAffichage.php?licence=...`)
URL: https://ffe.echecs.asso.fr/ffe-front/Homologation/GrillesAffichage.php?licence=A54038xxx

### Structure Table Résultats
```html
<table>
  <tr class="header-row">
    <td colspan="13">TOURNOI - Date - Lieu</td>
  </tr>
  <tr class="columns-row">
    <td>Ronde</td>
    <td>N°</td>
    <td>Nom adversaire</td>
    <td>Elo Adv</td>
    <td>Résultat</td>
    <td>Points</td>
    <td>...</td>
  </tr>
  <tr class="match-data">
    <td class="round">1</td>              <!-- Cell[0] -->
    <td class="pair-number">5</td>        <!-- Cell[1] -->
    <td class="opponent">NOM Prén</td>    <!-- Cell[2] -->
    <td class="adv-elo">1500</td>         <!-- Cell[3] -->
    <td class="result">1</td>             <!-- Cell[4] Victoire -->
    <td class="points">3.5</td>           <!-- Cell[5] -->
    <!-- ... autres colonnes ... -->
    <td>Perf</td>                         <!-- Cell[8] Performance -->
    <td>Variation</td>                    <!-- Cell[9] ΔElo -->
    <td>Nouveau Elo</td>                  <!-- Cell[10] Elo final -->
  </tr>
</table>
```

**INDICES CORRECTS (Ga page):**
- `Cell[0]` = Numéro de ronde
- `Cell[1]` = Numéro d'appariement
- `Cell[2]` = Nom adversaire
- `Cell[3]` = ELO adversaire
- `Cell[4]` = **Résultat** (1 = victoire, 0 = défaite, 0.5 = nulle)
- `Cell[5]` = Points tournoi
- `Cell[8]` = Performance
- `Cell[9]` = **Variation ELO** (ΔElo)
- `Cell[10]` = **Nouveau ELO** (Elo après match)

### 🎯 VALEURS RÉSULTAT (Cell[4])
Le contenu est **TEXTE BRUT**:
- `"1"` → Victoire (gain complet)
- `"0"` → Défaite (pas de points)
- `"0.5"` → Nulle (demi-point)

⚠️ **PAS de classes CSS pour les couleurs** - c'est du texte simple à afficher tel quel.

---

## 🏗️ STRUCTURE PARSER ACTUEL (`src/lib/parser.ts`)

### Page Liste (Ls)
```typescript
const cells = row.querySelectorAll('td');
const licence = cells[0]?.textContent?.trim();  // ✅ Licence
const name = cells[1]?.textContent?.trim();     // ✅ Nom
const elo = cells[2]?.textContent?.trim();      // ✅ ELO
```

### Page Résultats (Ga)
```typescript
const cells = row.querySelectorAll('td');
const opponent = cells[2]?.textContent?.trim();     // ✅ Adversaire
const result = cells[4]?.textContent?.trim();       // ✅ Résultat (1/0/0.5)
const eloChange = cells[9]?.textContent?.trim();    // ✅ ΔElo
const newElo = cells[10]?.textContent?.trim();      // ✅ Nouvel Elo
```

---

## ✅ ÉTAT ACTUEL
- **Parser:** FONCTIONNE avec indices corrects
- **Déploiement:** https://hay-chess-tracker.vercel.app
- **Data:** 5 joueurs Hay Chess affichés avec Elo/Points corrects

## ❌ À FAIRE (Prochaine session)
1. **UI Result Display:** Changer couleurs vert/rouge → Texte "1", "0", "0.5"
2. **Checkbox:** Ajouter case à cocher pour validation
3. **Style:** Appliquer thème Miami Vice (voir `🎯 PROMPT STANDARDS PROFESSIONNELS.txt`)

---

## 📚 SOURCES VÉRIFIÉES
- Analyse HTML: `analyze-ffe-deep.cjs`, `analyze-ffe-list-page.cjs`
- Fichiers HTML: `ffe-results.html`, `ffe-list.html`
- Tests: `src/lib/parser.real.test.ts`
- Dernière vérification: 2025-10-31

**Parser status:** ✅ PRODUCTION READY
**UI status:** ⚠️ NEEDS UPDATES (3 items pending)
