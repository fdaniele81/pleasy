# Pleasy

Piattaforma open source per **project management**, **pianificazione risorse** e **consuntivazione ore**.

Pensata per team di consulenza e software house che gestiscono progetti a corpo e Time & Material.

## Funzionalit&agrave;

- **Dashboard** &mdash; KPI, grafici budget vs actual, overview progetti
- **Gestione progetti** &mdash; Progetti a corpo e T&M, task gerarchici con budget e avanzamento
- **Pianificazione risorse** &mdash; Gantt chart interattivo, capacity plan, vista globale
- **Consuntivazione ore** &mdash; Timesheet settimanale con griglia editabile e submission mensile
- **Stime e preventivi** &mdash; Creazione stime con distribuzione fasi, conversione automatica in progetto
- **Gestione clienti e team** &mdash; Multi-company, ruoli (Admin, PM, User), RBAC
- **Ferie e permessi** &mdash; Calendario festivit&agrave; aziendali, piano ferie/permessi/malattia
- **Report e quadratura** &mdash; Riconciliazione timesheet con dati esterni, export Excel
- **Multilingua** &mdash; Italiano e Inglese

## Tech Stack

| Componente | Tecnologia |
|------------|-----------|
| **Frontend** | React 19, Redux Toolkit, RTK Query, Tailwind CSS v4, Vite |
| **Backend** | Node.js, Express v5, JWT, bcrypt |
| **Database** | PostgreSQL 16 |
| **Infra** | Docker, nginx |

## Quick Start con Docker

```bash
git clone https://github.com/YOUR_USERNAME/pleasy.git
cd pleasy
cp .env.example .env
# Modifica .env con password sicure e JWT secret
docker compose up -d
```

L'applicazione sar&agrave; disponibile su `http://localhost` (porta 80).

Al primo avvio, il database viene inizializzato automaticamente con lo schema.

## Sviluppo locale

### Prerequisiti

- Node.js &ge; 20
- PostgreSQL &ge; 15
- npm &ge; 9

### 1. Database

```bash
createdb pleasy
psql -d pleasy -f backend/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Modifica .env con le credenziali del tuo database
npm install
npm run dev
```

Il backend sar&agrave; disponibile su `http://localhost:5001`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Il frontend sar&agrave; disponibile su `http://localhost:5173`.

## Struttura del progetto

```
pleasy/
├── backend/                # API REST (Node.js / Express v5)
│   ├── src/
│   │   ├── index.js        # Entry point
│   │   ├── db.js           # Connection pool PostgreSQL
│   │   ├── routes/         # Definizione rotte (14 moduli)
│   │   ├── controllers/    # Gestione HTTP
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access (SQL parametrizzate)
│   │   ├── middlewares/    # Auth JWT, RBAC, rate limiting
│   │   ├── validators/    # Validazione input
│   │   └── utils/         # Logger, error handler, Excel parser
│   ├── Dockerfile
│   └── package.json
├── frontend/               # SPA (React 19 / Vite)
│   ├── src/
│   │   ├── features/       # 16 moduli funzionali
│   │   ├── api/            # RTK Query (data fetching + cache)
│   │   ├── store/          # Redux store (auth, toast)
│   │   ├── shared/         # Componenti riutilizzabili
│   │   ├── hooks/          # Hook personalizzati
│   │   └── constants/      # Rotte, ruoli, stati
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml      # Stack completo (DB + BE + FE)
├── version.json            # Versione unica del prodotto (source of truth)
├── .env.example            # Template variabili d'ambiente
└── LICENSE                 # MIT
```

## Architettura

### Backend: Routes &rarr; Controllers &rarr; Services &rarr; Repositories

```
HTTP Request
    &darr;
Route (path + middleware auth/RBAC)
    &darr;
Controller (parsing request, formatting response)
    &darr;
Service (business logic, validazioni)
    &darr;
Repository (query SQL parametrizzate)
    &darr;
PostgreSQL
```

### Frontend: Feature modules + RTK Query

Ogni funzionalit&agrave; &egrave; un modulo indipendente con componenti, endpoint API, hook, traduzioni e utility propri.

### Autenticazione

- JWT con cookie httpOnly (access token 1h + refresh token 7d)
- RBAC su ogni rotta: **Admin**, **PM**, **User**
- Isolamento dati per `company_id` (multi-tenancy)

## API

14 gruppi di endpoint sotto `/api`:

| Endpoint | Descrizione | Ruoli |
|----------|-------------|-------|
| `/api/auth` | Login, logout, refresh, impersonate | Misto |
| `/api/company` | Gestione azienda | Admin |
| `/api/user` | Gestione utenti | Admin |
| `/api/client` | Gestione clienti | Admin, PM |
| `/api/project` | CRUD progetti | Admin, PM |
| `/api/task` | Gestione task | Tutti |
| `/api/task-etc` | Estimate To Complete | Tutti |
| `/api/timesheet` | Registrazione ore | Tutti |
| `/api/timeoff` | Piano ferie e permessi | Tutti |
| `/api/holidays` | Calendario festivit&agrave; | Admin |
| `/api/estimate` | Stime e preventivi | Admin, PM |
| `/api/project-draft` | Bozze progetto | Admin, PM |
| `/api/reconciliation` | Quadratura timesheet | Admin, PM |
| `/api/dashboard` | Metriche e KPI | Tutti |

## Versioning

La versione del prodotto &egrave; definita in un unico file `version.json` alla root del progetto:

```json
{ "version": "1.0.2" }
```

- **Backend**: legge `version.json` all'avvio e lo espone via `GET /api/version`
- **Frontend**: Vite inietta la versione a build time (costante `__APP_VERSION__`), senza chiamate API

Per aggiornare la versione, modificare solo `version.json` e riavviare/rebuildare.

## Variabili d'ambiente

### Root (Docker Compose)

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `PGDATABASE` | `pleasy` | Nome database |
| `PGUSER` | `postgres` | Utente database |
| `PGPASSWORD` | - | Password database |
| `JWT_SECRET` | - | Chiave segreta JWT (`openssl rand -hex 64`) |
| `APP_PORT` | `80` | Porta pubblica applicazione |
| `DB_EXTERNAL_PORT` | `5432` | Porta esterna database |
| `CORS_ORIGINS` | - | Origini CORS (separate da virgola) |

### Backend (`backend/.env`)

| Variabile | Descrizione |
|-----------|-------------|
| `PORT` | Porta server (default 5001) |
| `PGHOST` | Host PostgreSQL |
| `PGPORT` | Porta PostgreSQL |
| `PGDATABASE` | Nome database |
| `PGUSER` | Utente database |
| `PGPASSWORD` | Password database |
| `JWT_SECRET` | Chiave segreta JWT |
| `CORS_ORIGINS` | Origini CORS |

### Frontend (`frontend/.env`)

| Variabile | Descrizione |
|-----------|-------------|
| `VITE_API_URL` | URL backend API |
| `VITE_HOME_URL` | URL landing page |

## Deploy

### Self-hosting con Docker (consigliato)

```bash
cp .env.example .env
# Configura .env con password sicure
docker compose up -d
```

### Deploy separato (FE su CDN + BE su VPS)

**Backend su VPS:**
```bash
cd backend
docker build -t pleasy-backend .
docker run -p 5001:5001 --env-file .env pleasy-backend
```

**Frontend su Cloudflare Pages:**
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Variabile: `VITE_API_URL=https://api.yourdomain.com`

## Sicurezza

- JWT con cookie httpOnly e flag secure in produzione
- RBAC (Role-Based Access Control) su ogni rotta
- Query SQL parametrizzate (protezione SQL injection)
- Rate limiting su login e impersonation
- Helmet per security headers (CSP, HSTS)
- Bcrypt per hashing password
- DOMPurify per sanitizzazione HTML (rich text editor)
- Isolamento dati multi-tenant per `company_id`

## Licenza

Distribuito sotto licenza [MIT](LICENSE).
