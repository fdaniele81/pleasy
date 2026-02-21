# Pleasy Frontend

Applicazione web **React** per **Pleasy**, piattaforma open source di project management, pianificazione risorse e consuntivazione ore.

Costruita con **React 19**, **Redux Toolkit**, **RTK Query**, **Tailwind CSS v4** e **Vite**.

> Questo modulo fa parte del monorepo [Pleasy](../README.md). Per il quick start completo (Docker) consulta il README principale.

## Architettura

```
src/
├── App.jsx                    # Router principale e layout
├── main.jsx                   # Entry point React
├── index.css                  # Stili globali Tailwind
├── i18n/                      # Configurazione i18next
├── api/
│   ├── apiSlice.js            # RTK Query base (auto-refresh token)
│   ├── client.js              # Gestione token autenticazione
│   ├── tags.js                # Tag per invalidazione cache
│   └── cacheStrategies.js     # Strategie di caching
├── store/
│   ├── store.js               # Configurazione Redux store
│   └── slices/
│       ├── authSlice.js       # Stato autenticazione
│       └── toastSlice.js      # Notifiche toast
├── features/                  # Moduli funzionali (16 feature)
│   └── [feature]/
│       ├── Feature.jsx        # Componente principale
│       ├── api/               # Endpoint RTK Query
│       ├── components/        # Componenti specifici
│       ├── hooks/             # Hook personalizzati
│       ├── utils/             # Utilità specifiche
│       └── translations/      # Traduzioni IT/EN
├── shared/
│   ├── components/            # Componenti riutilizzabili
│   │   ├── Header.jsx         # Navigazione principale
│   │   ├── RichTextEditor.jsx # Editor TipTap
│   │   ├── gantt/             # Componenti Gantt condivisi
│   │   └── skeletons/         # Loading skeleton
│   ├── ui/                    # Componenti UI base
│   │   ├── Button.jsx
│   │   ├── Toast.jsx
│   │   ├── ConfirmationModal.jsx
│   │   ├── DateInput.jsx
│   │   └── ...
│   └── translations/          # Traduzioni condivise
├── hooks/                     # Hook globali
├── utils/                     # Utilità globali
└── constants/                 # Costanti (rotte, ruoli, stati)
```

**Pattern**: Feature-based modules con RTK Query per data fetching e caching.

## Sviluppo locale

### Prerequisiti

- **Node.js** &ge; 20
- **npm** &ge; 9
- **Pleasy Backend** in esecuzione (vedi [backend](../backend/))

### 1. Configura e avvia

```bash
cd frontend
cp .env.example .env
# Modifica .env con l'URL del backend
npm install
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`.

## Moduli funzionali

| Modulo | Ruoli | Descrizione |
|--------|-------|-------------|
| `login` | Tutti | Autenticazione |
| `companies` | Admin | Gestione azienda |
| `users` | Admin, PM | Gestione utenti |
| `clients` | PM | Gestione clienti |
| `projects` | PM | CRUD progetti |
| `planning` | PM | Pianificazione task + Gantt |
| `tmplanning` | PM | Pianificazione Time & Material |
| `estimator` | PM | Stime e preventivi |
| `capacity-plan` | PM | Capacity planning |
| `dashboard` | PM | Dashboard KPI |
| `timesheet` | PM, User | Consuntivazione ore |
| `timeoffplan` | Admin, PM | Piano ferie e permessi |
| `holidays` | Admin, PM | Calendario festività |
| `timesheetsnapshots` | PM | Snapshot timesheet |
| `templateconfiguration` | PM | Configurazione template riconciliazione |
| `reconciliation` | PM | Quadratura timesheet |

## Variabili d'ambiente

| Variabile | Obbligatoria | Default | Descrizione |
|-----------|:---:|---------|-------------|
| `VITE_API_URL` | Si | - | URL del backend API |
| `VITE_HOME_URL` | No | - | URL della landing page |

## Comandi disponibili

```bash
npm run dev      # Server di sviluppo Vite
npm run build    # Build di produzione
npm run lint     # Lint con ESLint
npm run preview  # Preview build di produzione
```

## Docker

### Solo frontend

```bash
docker build -t pleasy-frontend .
docker run -p 80:80 pleasy-frontend
```

> **Nota**: In Docker, `VITE_API_URL` è vuoto. Le chiamate API vengono proxied da nginx al backend su `http://backend:5001`. Se il backend non si chiama "backend" nella tua rete Docker, modifica [nginx.conf](nginx.conf).

Per il deploy full-stack con Docker Compose, vedi il [docker-compose.yml](../docker-compose.yml) nella root del monorepo.

## Stack tecnologico

| Libreria | Versione | Scopo |
|----------|---------|-------|
| React | 19.x | UI framework |
| Redux Toolkit | 2.x | State management |
| RTK Query | 2.x | Data fetching e caching |
| React Router | 7.x | Routing client-side |
| Tailwind CSS | 4.x | Styling utility-first |
| TipTap | 3.x | Rich text editor |
| Recharts | 2.x | Grafici e chart |
| i18next | 25.x | Internazionalizzazione |
| ExcelJS | 4.x | Export Excel |
| Lucide React | 0.x | Icone SVG |
| DOMPurify | 3.x | Sanitizzazione HTML |
| Vite | 7.x | Build tool |

## Licenza

Distribuito sotto licenza [MIT](../LICENSE).
