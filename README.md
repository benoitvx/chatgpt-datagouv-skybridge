# ChatGPT App data.gouv.fr

![POC](https://img.shields.io/badge/status-POC-orange)
![Skybridge](https://img.shields.io/badge/framework-Skybridge-blue)
![DINUM](https://img.shields.io/badge/DINUM-Etalab-green)

> Accédez aux données publiques françaises en langage naturel dans ChatGPT

Application ChatGPT permettant de rechercher, explorer et visualiser les jeux de données de [data.gouv.fr](https://www.data.gouv.fr) directement dans une conversation.

---

## Objectif

- Démocratiser l'accès aux **40 000+ datasets** de data.gouv.fr
- Permettre aux citoyens de requêter les données en **français naturel**
- Générer automatiquement des **visualisations** (graphiques)

## Fonctionnalités

| Outil | Description | Widget |
|-------|-------------|--------|
| `search-datasets` | Recherche de jeux de données | Cards avec titre, description, organisation |
| `get-dataset-schema` | Récupération du schéma des colonnes | JSON (guide ChatGPT) |
| `query-dataset` | Interrogation et visualisation | Bar chart interactif |

**Workflow guidé** : Les descriptions des outils orientent ChatGPT vers le parcours optimal :
```
search-datasets → get-dataset-schema → query-dataset
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | [Skybridge](https://skybridge.tech) |
| Serveur | Node.js + `skybridge/server` |
| Widgets | React + `skybridge/web` + Chart.js |
| Build | Vite + plugin Skybridge |
| Hébergement | [Fly.io](https://fly.io) |
| APIs | [data.gouv.fr](https://www.data.gouv.fr/api/) + [API Tabular](https://tabular-api.data.gouv.fr) |

## Installation

### Prérequis

- Node.js >= 22
- pnpm

### Clone et installation

```bash
git clone https://github.com/benoitvx/chatgpt-datagouv-skybridge.git
cd chatgpt-datagouv-skybridge
pnpm install
```

### Développement local

```bash
# Lancer le serveur de dev (server + web en hot reload)
pnpm dev
```

Le serveur écoute sur `http://localhost:3000`.

Pour exposer localement à ChatGPT :
```bash
ngrok http 3000
# Puis utiliser l'URL https://xxxx.ngrok-free.app/mcp
```

## Déploiement

```bash
# Connexion à Fly.io
fly auth login

# Déployer
fly deploy
```

L'application sera accessible sur `https://chatgpt-datagouv-v2.fly.dev`.

## Connexion à ChatGPT

1. Ouvrir ChatGPT → **Settings** → **Apps & Connectors** → **Advanced Settings**
2. Cliquer sur **Create app**
3. Entrer l'URL : `https://chatgpt-datagouv-v2.fly.dev/mcp`
4. Valider la création

### Test

Dans une conversation ChatGPT, taper :
```
@data.gouv recherche bornes de recharge électrique
```

ChatGPT va :
1. Appeler `search-datasets` → afficher les résultats en cards
2. Appeler `get-dataset-schema` → récupérer les colonnes
3. Appeler `query-dataset` → générer un graphique

## Structure du projet

```
chatgpt-datagouv-skybridge/
├── server/
│   ├── src/
│   │   ├── index.ts           # Point d'entrée Express
│   │   ├── server.ts          # Définition du serveur MCP Skybridge
│   │   ├── middleware.ts      # Middleware MCP
│   │   ├── env.ts             # Variables d'environnement
│   │   └── lib/
│   │       └── datagouv-api.ts  # Client API data.gouv.fr
│   └── package.json
├── web/
│   ├── src/
│   │   ├── helpers.ts         # Hook useToolInfo
│   │   └── widgets/
│   │       ├── search-datasets.tsx   # Widget cards résultats
│   │       └── query-dataset.tsx     # Widget bar chart
│   ├── vite.config.ts
│   └── package.json
├── Dockerfile
├── fly.toml
├── pnpm-workspace.yaml
└── README.md
```

## Liens

- **Production** : https://chatgpt-datagouv-v2.fly.dev
- **API data.gouv.fr** : https://www.data.gouv.fr/api/
- **API Tabular** : https://tabular-api.data.gouv.fr
- **Skybridge** : https://skybridge.tech
- **DINUM** : https://www.numerique.gouv.fr/dinum/

## Licence

MIT

## Auteur

**Benoit Vinceneux**
EIG @ DINUM
