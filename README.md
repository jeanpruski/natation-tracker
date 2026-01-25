# NaTrack – Suivi Natation & Running

Application web responsive pour suivre ses séances de natation et de running, visualiser l’évolution des distances parcourues et obtenir des stats détaillées.

- KPIs: total du mois, meilleure semaine, meilleures distances, séries
- Mode clair/sombre (préférence persistée) et écran de chargement plein écran (logo + spinner)
- Historique avec pagination, édition et suppression
- Import/Export CSV
- Édition déverrouillable par clé (token) + overlay de blocage pendant les actions

---

## ✨ Fonctionnalités

- **Ajout de séances** avec type (natation/running), distance et date (aujourd’hui par défaut ou date personnalisée)
- **KPIs**: total du mois, meilleure semaine, meilleure distance, série la plus longue
- **Graphiques**:
  - Courbe des séances
  - Barres cumul mensuel
  - Répartition par sport
  - Calendrier d'activité (heatmap)
- **Historique**:
  - Pagination (12/s page), édition inline, suppression
  - Tri décroissant par date
- **Mode clair/sombre**: toggle manuel, préférence persistée; écran de chargement plein écran respectant le thème
- **Import/Export CSV** des données
- **Mode édition**: verrouillage/déverrouillage par clé (token) + blocage UI pendant les actions CRUD

---

## 🖼️ Aperçu de l’interface

- **Mobile** : disposition en pile (Options → Graphiques → Historique)
- **Desktop** :
  - Colonne gauche : KPIs + actions
  - Colonne droite : Graphiques, stats, historique

---

## 🛠️ Stack technique

- [React](https://react.dev/) 18
- [Tailwind CSS](https://tailwindcss.com/) 3.x
- [Recharts](https://recharts.org/en-US/) pour les graphiques
- [Lucide React](https://lucide.dev/) pour les icônes
- [Day.js](https://day.js.org/) pour la gestion des dates (locale fr)

---

## 🚀 Installation

1. **Cloner le repo**  
```bash
git clone <votre-repo>
cd <votre-repo>
````

2. **Installer les dépendances**

```bash
npm install
```

3. **Lancer l’application**

```bash
npm start
  ```

4. **Accéder dans le navigateur**

```
http://localhost:3000
```

---

## ⚙️ Configuration

L’app utilise Tailwind avec PostCSS et Autoprefixer.
Fichier `tailwind.config.js` minimal :

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [],
};
```

Fichier `src/index.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🔌 API & Variables d’environnement

- Base API: `REACT_APP_API_BASE` (optionnelle). Par défaut: `"/api"`.
- Endpoints utilisés:
  - `GET /sessions` → `[{ id, date: YYYY-MM-DD, distance: number, type: "swim" | "run" }, ...]`
  - `POST /sessions` (auth requise) → crée une séance
  - `PUT /sessions/:id` (auth requise) → met à jour une séance
  - `DELETE /sessions/:id` (auth requise) → supprime une séance
  - `GET /auth/check` avec header `Authorization: Bearer <token>` → valide la clé d’édition

Stockages navigateur:
- `localStorage["theme_dark"]`: préférence de thème
- `localStorage["edit_token"]`: clé d’édition (si saisie)

Exemple `.env`:

```
REACT_APP_API_BASE=/api
```

---

## 📂 Structure des fichiers

```
src/
├── App.js               # Orchestration de l’UI (KPIs, graphiques, historique, modal)
├── index.js             # Point d'entrée React
├── index.css            # Styles Tailwind
├── constants/
│   └── layout.js         # Constantes UI partagées
├── components/
│   ├── AnimatedNumber.jsx
│   ├── AddSessionForm.jsx
│   ├── CalendarHeatmap.jsx
│   ├── EditAuthModal.jsx
│   ├── History.jsx
│   ├── KpiChip.jsx
│   ├── MonthlyBarChart.jsx
│   ├── Reveal.jsx
│   ├── SportSharePie.jsx
│   ├── SwimChart.jsx
│   ├── ThemeToggle.jsx
│   ├── Toast.jsx
│   └── TypePill.jsx
├── hooks/
│   ├── useEditAuth.js
│   └── useTheme.js       # useTheme, useLocalStorage, useIsDark
├── sections/
│   ├── AppHeader.jsx
│   ├── BusyOverlay.jsx
│   ├── Dashboard.jsx
│   ├── EditModal.jsx
│   └── LoadingScreen.jsx
└── utils/
    ├── api.js           # apiGet, apiJson, API_BASE
    ├── appUtils.js      # helpers format/normalisation sessions
    ├── downloadCSV.js
    ├── parseCSV.js
    └── strings.js       # capFirst
```

---

## 🔐 Édition & sécurité

- L’édition est verrouillée par défaut. Cliquez sur « Éditer » et saisissez la **clé d’édition**.
- La clé est vérifiée via `GET /auth/check` avec le header `Authorization: Bearer <token>`.
- Une fois validée, la clé est conservée en local dans `localStorage["edit_token"]` jusqu’à « Verrouiller ».

---

## 📜 Licence

Ce projet est libre pour usage personnel.
