# 🏊‍♂️ Suivi Natation – React + Tailwind + Recharts

Application web responsive pour suivre ses séances de natation, visualiser l’évolution des distances parcourues et obtenir un cumul mensuel.  
Mode clair/sombre, export CSV, pagination et édition des séances inclus.

---

## ✨ Fonctionnalités

- **Ajout de séances** avec métrage et date (date automatique ou personnalisée)
- **Visualisation graphique** :
  - Courbe des séances
  - Diagramme en barres du cumul mensuel
- **Historique complet** :
  - Pagination (5 séances/page)
  - Modification ou suppression d’une séance
  - Tri par date (plus récentes en haut)
- **Mode clair / sombre** (switch manuel)
- **Export CSV** des données
- **Données sauvegardées** dans `localStorage` (persistantes entre sessions)

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
- [Day.js](https://day.js.org/) pour la gestion des dates

---

## 🚀 Installation

1. **Cloner le repo**  
```bash
git clone https://github.com/toncompte/natation-tracker.git
cd natation-tracker
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

## ⚙️ Configuration Tailwind CSS

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

## 📂 Structure des fichiers

```
src/
├── App.js               # Composant principal
├── index.js             # Point d'entrée React
├── index.css            # Styles Tailwind
├── components/          # Composants (AddSessionForm, History, SwimChart...)
└── ...
```

---

## 💾 Sauvegarde des données

Toutes les séances sont enregistrées dans le navigateur via **localStorage** avec la clé :

```
swim_sessions
```

---

## 📜 Licence

Ce projet est libre pour usage personnel.
Créé avec ❤️ pour le suivi sportif.