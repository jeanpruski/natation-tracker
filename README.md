# NaTrack – Suivi Natation & Running (Multi-User v2)

Application web responsive pour suivre ses séances de natation et de running, visualiser l’évolution des distances parcourues et obtenir des stats détaillées.

- 🚀 Nouvelle version multi-utilisateurs : dashboard global + dashboards individuels
- KPIs: total du mois, meilleure semaine, meilleures distances, series
- Mode clair/sombre (preference persistee) et ecran de chargement plein ecran (logo + spinner)
- Historique avec pagination, edition et suppression
- Import/Export CSV
- Edition securisee par login (email + mot de passe) + overlay de blocage pendant les actions

---

## ✨ Fonctionnalites

- **V2 Multi-User (nouveau)** :
  - **Dashboard global public** avec comparaison des performances par utilisateur
  - **Dashboards individuels** (memes fonctionnalites que la V1)
  - **Acces en lecture** aux dashboards des autres
  - **Edition reservee** a l'utilisateur connecte ou a l'admin
  - **Admin** : peut modifier les donnees de tous les utilisateurs

- **Ajout de seances** avec type (natation/running), distance et date (aujourd'hui par defaut ou date personnalisee)
- **KPIs**: total du mois, meilleure semaine, meilleure distance, serie la plus longue
- **Graphiques**:
  - Courbe des seances
  - Barres cumul mensuel
  - Répartition par sport
  - Calendrier d'activite (heatmap)
  - Comparatif global (sparklines + classement)
- **Historique**:
  - Pagination (12/s page), edition inline, suppression
  - Tri decroissant par date
- **Mode clair/sombre**: toggle manuel, preference persistee; ecran de chargement plein ecran respectant le theme
- **Import/Export CSV** des données
- **Mode edition**: verrouillage/deverrouillage par login + blocage UI pendant les actions CRUD

---

## 🖼️ Apercu de l’interface

- **Mobile** : disposition en pile (Global → Dashboards → Historique)
- **Desktop** :
  - Dashboard global : comparaison utilisateurs + selection
  - Dashboard perso : KPIs + graphiques + historique

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
- Endpoints utilises:
  - **Public**:
    - `GET /sessions` → liste globale
    - `GET /dashboard/global` → statistiques globales
    - `GET /users/public` → liste des utilisateurs (id, name)
  - **Auth**:
    - `POST /auth/login` → JWT
    - `GET /auth/me` → utilisateur connecte
  - **User**:
    - `GET /me/sessions`
    - `POST /me/sessions`
    - `PUT /me/sessions/:id`
    - `DELETE /me/sessions/:id`
  - **Admin**:
    - `GET /users`
    - `GET /users/:userId/sessions`
    - `POST /users/:userId/sessions`
    - `PUT /users/:userId/sessions/:id`
    - `DELETE /users/:userId/sessions/:id`

Stockages navigateur:
- `localStorage["theme_dark"]`: preference de theme
- `localStorage["auth_token"]`: JWT (auth)

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

## 🔐 Edition & securite

- L’edition est verrouillee par defaut. Cliquez sur « Editer » et connectez-vous.
- Les utilisateurs peuvent consulter tous les dashboards, mais **modifier uniquement leurs donnees**.
- Les admins peuvent modifier toutes les donnees.
- Le JWT est stocke dans `localStorage["auth_token"]` jusqu’a « Verrouiller ».

