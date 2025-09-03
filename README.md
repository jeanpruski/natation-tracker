# 🏊‍♂️ Suivi Natation – React + Tailwind + Recharts

Application web responsive pour suivre ses séances de natation, visualiser l’évolution des distances parcourues et obtenir un cumul mensuel.

- KPIs: Total du mois, Moyenne/séance, Dernière séance (jour + date + jours écoulés)
- Mode clair/sombre (préférence persistée) et écran de chargement plein écran (logo + spinner), compatible dark mode
- Historique avec pagination, modification et suppression
- Export CSV
- Édition déverrouillable par clé (token)

---

## ✨ Fonctionnalités

- **Ajout de séances** avec métrage et date (aujourd’hui par défaut ou date personnalisée)
- **KPIs**: Total du mois, Moyenne/séance, Dernière séance (ex: « Mercredi 03 janv. 2025 » et « 4 j » depuis)
- **Graphiques**:
  - Courbe des séances
  - Barres cumul mensuel
- **Historique**:
  - Pagination (5/s page), édition inline, suppression
  - Tri décroissant par date
- **Mode clair/sombre**: toggle manuel, préférence persistée; écran de chargement plein écran respectant le thème
- **Export CSV** des données visibles
- **Mode édition**: verrouillage/déverrouillage par clé (token)

---

## 🖼️ Aperçu de l’interface

- **Mobile** : disposition en pile (Options → Graphiques → Historique)
- **Desktop** :
  - Colonne gauche : Options + Historique
  - Colonne droite : Graphiques (courbe + cumul mensuel)

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
  - `GET /sessions` → `[{ id, date: YYYY-MM-DD, distance: number }, ...]`
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
├── components/
│   ├── AddSessionForm.jsx
│   ├── EditAuthModal.jsx
│   ├── History.jsx
│   ├── KpiChip.jsx
│   ├── MonthlyBarChart.jsx
│   ├── SwimChart.jsx
│   └── ThemeToggle.jsx
├── hooks/
│   ├── useEditAuth.js
│   └── useTheme.js       # useTheme, useLocalStorage, useIsDark
└── utils/
    ├── api.js           # apiGet, apiJson, API_BASE
    ├── downloadCSV.js
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
Créé avec ❤️ pour le suivi sportif.
