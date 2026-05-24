# Dialaw TV — Documentation Technique

## Table des matières

1. [Présentation](#présentation)
2. [Architecture](#architecture)
3. [Stack technique](#stack-technique)
4. [Structure du projet](#structure-du-projet)
5. [Backend — API REST](#backend--api-rest)
6. [Frontend — Pages et composants](#frontend--pages-et-composants)
7. [Base de données](#base-de-données)
8. [Déploiement](#déploiement)
9. [Variables d'environnement](#variables-denvironnement)
10. [Comptes par défaut](#comptes-par-défaut)

---

## Présentation

**Dialaw TV - Livre Journal** est un système de gestion comptable développé pour Dialaw TV. Il permet de suivre les entrées et sorties financières, gérer les membres de l'équipe, les catégories, les comptes et les utilisateurs, avec un tableau de bord analytique.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│    VERCEL       │               │    RENDER       │
│                 │               │                 │
│  React App      │  API REST     │  Node.js +      │
│  (Frontend)     │ ────────────► │  Express        │
│                 │  HTTPS/JSON   │  (Backend)      │
│  Port : 443     │               │  Port : 10000   │
└─────────────────┘               └────────┬────────┘
         │                                 │
         │                                 ▼
         │                        ┌─────────────────┐
         │                        │     NEON        │
         │                        │                 │
         │                        │  PostgreSQL     │
         │                        │  (Base de       │
         │                        │   données)      │
         │                        │                 │
         │                        └─────────────────┘
         │
         ▼
┌─────────────────┐
│  UPTIMEROBOT    │
│  Monitoring     │
│  (ping /5 min)  │
└─────────────────┘
```

### Flux d'une requête

```
Utilisateur
    │
    ▼
Navigateur (Vercel)
    │  1. Saisie email/mot de passe
    ▼
React App
    │  2. POST /api/auth/login
    ▼
Express (Render)
    │  3. Vérification JWT + bcrypt
    ▼
PostgreSQL (Neon)
    │  4. SELECT users WHERE email = ...
    ▼
Express → React → Navigateur
    │  5. Token JWT retourné
    ▼
Utilisateur connecté
```

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React | 19 |
| Routage frontend | React Router DOM | 7 |
| Graphiques | Recharts | 3 |
| Icônes | Lucide React | 1 |
| Notifications | React Hot Toast | 2 |
| Requêtes HTTP | Axios | 1 |
| Backend | Node.js + Express | 5 |
| Authentification | JSON Web Token (JWT) | 9 |
| Hashage mot de passe | bcryptjs | 3 |
| Base de données | PostgreSQL (Neon) | 17 |
| Driver PostgreSQL | pg (node-postgres) | 8 |
| Hébergement frontend | Vercel | — |
| Hébergement backend | Render | — |
| Monitoring | UptimeRobot | — |

---

## Structure du projet

```
dialaw-tv/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentification (login, /me)
│   │   ├── categories.js    # CRUD catégories
│   │   ├── comptes.js       # CRUD comptes
│   │   ├── dashboard.js     # Statistiques et graphiques
│   │   ├── ecritures.js     # CRUD opérations (entrées/sorties)
│   │   ├── membres.js       # CRUD membres de l'équipe
│   │   └── users.js         # CRUD utilisateurs (admin)
│   ├── database.js          # Connexion PostgreSQL + init tables
│   ├── middleware.js        # JWT auth + contrôle des rôles
│   ├── server.js            # Point d'entrée Express
│   ├── render.yaml          # Config déploiement Render
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js    # Sidebar + navigation principale
│   │   ├── pages/
│   │   │   ├── Login.js        # Page de connexion
│   │   │   ├── Dashboard.js    # Tableau de bord / statistiques
│   │   │   ├── Journal.js      # Livre journal (liste opérations)
│   │   │   ├── Categories.js   # Gestion des catégories
│   │   │   ├── Comptes.js      # Gestion des comptes
│   │   │   ├── Membres.js      # Gestion des membres
│   │   │   └── Utilisateurs.js # Gestion des utilisateurs (admin)
│   │   ├── AuthContext.js   # Contexte d'authentification React
│   │   ├── api.js           # Instance Axios configurée
│   │   ├── App.js           # Routes React
│   │   └── index.js         # Point d'entrée React
│   ├── .env.production      # URL backend en production
│   ├── vercel.json          # Config routing Vercel (SPA)
│   └── package.json
│
├── demarrer.bat             # Script démarrage Windows (local)
├── start.ps1                # Script PowerShell (local)
└── DOCUMENTATION.md
```

---

## Backend — API REST

URL de base en production : `https://dialaw-tv-backend.onrender.com`

### Authentification

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| POST | `/api/auth/login` | Public | Connexion, retourne un token JWT |
| GET | `/api/auth/me` | Authentifié | Infos de l'utilisateur connecté |

**Exemple login :**
```json
POST /api/auth/login
{
  "email": "admin@dialawtv.sn",
  "password": "admin2024"
}
```

**Réponse :**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "nom": "PDG Dialaw TV",
    "email": "admin@dialawtv.sn",
    "role": "admin"
  }
}
```

> Toutes les routes protégées nécessitent l'en-tête :
> `Authorization: Bearer <token>`

---

### Opérations (Journal)

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/ecritures` | Authentifié | Liste des opérations (filtres disponibles) |
| POST | `/api/ecritures` | Authentifié | Créer une opération |
| PUT | `/api/ecritures/:id` | Admin | Modifier une opération |
| DELETE | `/api/ecritures/:id` | Admin | Supprimer une opération |

**Paramètres GET :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `date_debut` | string | Filtre date début (YYYY-MM-DD) |
| `date_fin` | string | Filtre date fin (YYYY-MM-DD) |
| `type` | string | `entree` ou `sortie` |
| `search` | string | Recherche texte libre |
| `page` | number | Numéro de page (défaut: 1) |
| `limit` | number | Résultats par page (défaut: 50) |

**Exemple création :**
```json
POST /api/ecritures
{
  "date": "2026-05-24",
  "description": "Recette publicité",
  "type": "entree",
  "categorie": "Publicité",
  "montant": 150000,
  "notes": "Client ABC",
  "concerne": "Baye Niang"
}
```

---

### Catégories

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/categories` | Authentifié | Liste des catégories |
| POST | `/api/categories` | Admin | Créer une catégorie |
| PUT | `/api/categories/:id` | Admin | Modifier une catégorie |
| DELETE | `/api/categories/:id` | Admin | Supprimer une catégorie |

**Paramètres GET :**
| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `type` | `entree` ou `sortie` | Filtrer par type |
| `tous` | `1` | Inclure les catégories inactives |

---

### Comptes

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/comptes` | Authentifié | Liste des comptes |
| POST | `/api/comptes` | Admin | Créer un compte |
| PUT | `/api/comptes/:id` | Admin | Modifier un compte |
| DELETE | `/api/comptes/:id` | Admin | Supprimer un compte |

---

### Membres

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/membres` | Authentifié | Liste des membres |
| POST | `/api/membres` | Admin | Ajouter un membre |
| PUT | `/api/membres/:id` | Admin | Modifier un membre |
| DELETE | `/api/membres/:id` | Admin | Supprimer un membre |

---

### Utilisateurs

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/users` | Admin | Liste des utilisateurs |
| POST | `/api/users` | Admin | Créer un utilisateur |
| PUT | `/api/users/:id` | Admin | Modifier un utilisateur |
| DELETE | `/api/users/:id` | Admin | Désactiver un utilisateur |

---

### Dashboard

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/dashboard/stats` | Authentifié | Statistiques complètes |

**Paramètres :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `annee` | number | Année (défaut: année courante) |
| `mois` | number | Mois (défaut: mois courant) |

**Réponse :**
```json
{
  "mois": {
    "entrees": 500000,
    "sorties": 200000,
    "solde": 300000,
    "nb_operations": 12
  },
  "annee": {
    "entrees": 3000000,
    "sorties": 1200000,
    "solde": 1800000
  },
  "graphique_mensuel": [...],
  "top_entrees": [...],
  "top_sorties": [...],
  "dernieres_operations": [...]
}
```

---

### Health check

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/health` | Public | Vérifie que le serveur tourne |

---

## Frontend — Pages et composants

### Pages

| Page | Route | Accès | Description |
|------|-------|-------|-------------|
| Login | `/login` | Public | Formulaire de connexion |
| Dashboard | `/` | Authentifié | Tableau de bord avec graphiques |
| Journal | `/journal` | Authentifié | Liste et saisie des opérations |
| Catégories | `/categories` | Admin | Gestion des catégories |
| Comptes | `/comptes` | Authentifié | Gestion des comptes |
| Membres | `/membres` | Authentifié | Gestion des membres |
| Utilisateurs | `/utilisateurs` | Admin | Gestion des utilisateurs |

### Composants

| Composant | Description |
|-----------|-------------|
| `Layout.js` | Sidebar de navigation, header, gestion de la déconnexion |
| `AuthContext.js` | Contexte global : état de connexion, token JWT, rôle |
| `api.js` | Instance Axios avec baseURL et injection automatique du token |

### Rôles utilisateurs

| Fonctionnalité | Admin | Comptable |
|----------------|-------|-----------|
| Voir le dashboard | ✅ | ✅ |
| Voir le journal | ✅ | ✅ |
| Ajouter une opération | ✅ | ✅ |
| Modifier/supprimer une opération | ✅ | ❌ |
| Gérer les catégories | ✅ | ❌ |
| Gérer les comptes | ✅ | ❌ |
| Gérer les membres | ✅ | ❌ |
| Gérer les utilisateurs | ✅ | ❌ |

---

## Base de données

Hébergée sur **Neon PostgreSQL** (région : US East - Virginie du Nord).

### Tables

#### `users`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| nom | TEXT | Nom complet |
| email | TEXT UNIQUE | Adresse email |
| password | TEXT | Mot de passe hashé (bcrypt) |
| role | TEXT | `admin` ou `comptable` |
| actif | INTEGER | 1 = actif, 0 = désactivé |
| created_at | TIMESTAMP | Date de création |

#### `operations`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| date | TEXT | Date de l'opération (YYYY-MM-DD) |
| description | TEXT | Libellé de l'opération |
| type | TEXT | `entree` ou `sortie` |
| categorie | TEXT | Nom de la catégorie |
| montant | REAL | Montant en FCFA |
| notes | TEXT | Notes optionnelles |
| concerne | TEXT | Personne concernée |
| saisi_par | INTEGER FK | Référence vers `users.id` |
| created_at | TIMESTAMP | Date de saisie |

#### `categories`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| nom | TEXT | Nom de la catégorie |
| type | TEXT | `entree` ou `sortie` |
| actif | INTEGER | 1 = active, 0 = désactivée |
| created_at | TIMESTAMP | Date de création |

#### `membres`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| nom | TEXT | Nom du membre |
| prenom | TEXT | Prénom |
| telephone | TEXT | Numéro de téléphone |
| email | TEXT | Adresse email |
| actif | INTEGER | 1 = actif, 0 = inactif |
| created_at | TIMESTAMP | Date d'ajout |

#### `comptes`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| nom | TEXT | Nom du compte |
| numero | TEXT | Numéro de compte |
| solde_initial | REAL | Solde de départ en FCFA |
| actif | INTEGER | 1 = actif, 0 = inactif |
| created_at | TIMESTAMP | Date de création |

---

## Déploiement

### Infrastructure

| Service | Plateforme | URL | Plan |
|---------|------------|-----|------|
| Frontend | Vercel | https://dialaw-tv-ku9k.vercel.app | Gratuit |
| Backend | Render | https://dialaw-tv-backend.onrender.com | Gratuit |
| Base de données | Neon PostgreSQL | ep-late-bird-ap3nagr6-pooler.c-7.us-east-1.aws.neon.tech | Gratuit |
| Monitoring | UptimeRobot | stats.uptimerobot.com/fSF6aMsyT6 | Gratuit |
| Code source | GitHub | https://github.com/Gorgoum/dialaw-tv | Public |

### Déployer une mise à jour

Toute modification poussée sur la branche `main` de GitHub déclenche automatiquement :
- Un redéploiement sur **Vercel** (frontend)
- Un redéploiement sur **Render** (backend)

```bash
git add .
git commit -m "description de la modification"
git push
```

### Démarrage en local

**Prérequis :** Node.js >= 18, npm

```bash
# Backend
cd backend
npm install
node server.js        # démarre sur http://localhost:5050

# Frontend (autre terminal)
cd frontend
npm install
npm start             # démarre sur http://localhost:3000
```

Ou double-cliquer sur `demarrer.bat` (Windows).

---

## Variables d'environnement

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL Neon |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |
| `PORT` | Port du serveur (défaut: 10000 sur Render) |

### Frontend (Vercel)

| Variable | Fichier | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `.env.production` | URL du backend en production |

---

## Comptes par défaut

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@dialawtv.sn | admin2024 |
| Comptable | comptable@dialawtv.sn | comptable2024 |

> **Important :** Changez ces mots de passe en production depuis la page **Utilisateurs**.
