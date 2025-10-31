# 🏆 TOURNOIS À SUIVRE - HAY CHESS

## 📅 Calendrier FFE
https://www.echecs.asso.fr/Calendrier.aspx?jour=30/10/2025

---

## 🎯 TOURNOIS DÉPARTEMENTAL 2025

### Tournoi 1: U14 (Ref 68993)
- **Fiche:** https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=68993
- **Liste joueurs (Ls):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68993/68993&Action=Ls
- **Résultats (Ga):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68993/68993&Action=Ga

### Tournoi 2: (Ref 68994)
- **Fiche:** https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=68994
- **Liste joueurs (Ls):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68994/68994&Action=Ls
- **Résultats (Ga):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68994/68994&Action=Ga

### Tournoi 3: (Ref 68995)
- **Fiche:** https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=68995
- **Liste joueurs (Ls):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68995/68995&Action=Ls
- **Résultats (Ga):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68995/68995&Action=Ga

### Tournoi 4: (Ref 68997)
- **Fiche:** https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=68997
- **Liste joueurs (Ls):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68997/68997&Action=Ls
- **Résultats (Ga):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68997/68997&Action=Ga

### Championnat (Ref 68992)
- **Fiche:** https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=68992
- **Liste joueurs (Ls):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68992/68992&Action=Ls
- **Résultats (Ga):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68992/68992&Action=Ga

### Championnat (Ref 68991)
- **Fiche:** https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=68991
- **Liste joueurs (Ls):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68991/68991&Action=Ls
- **Résultats (Ga):** https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/68991/68991&Action=Ga

---

## 📋 PATTERN DE SCRAPING

Pour chaque tournoi FFE avec Ref=XXXXX:

1. **Page Liste (Action=Ls):**
   ```
   https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/XXXXX/XXXXX&Action=Ls
   ```
   → Récupère la liste des joueurs avec leurs clubs

2. **Page Résultats (Action=Ga):**
   ```
   https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/XXXXX/XXXXX&Action=Ga
   ```
   → Récupère la grille américaine avec résultats, points, Buchholz, Performance

3. **Filtrage:** Ne garder que les joueurs du club "Hay Chess"

---

## ⚠️ NOTES IMPORTANTES

- Utiliser ces URLs pour tester le parser
- Ne plus demander d'URLs au user
- Performance (Perf) = dernière cell `td.papi_r` de l'outer row
- Structure sub-table: 11 cells (Cell[10] = Buchholz, pas Performance)
