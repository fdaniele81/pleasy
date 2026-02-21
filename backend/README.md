# Pleasy Backend

REST API per **Pleasy**, piattaforma open source di project management, pianificazione risorse e consuntivazione ore.

Costruita con **Node.js**, **Express v5** e **PostgreSQL**.

> Questo modulo fa parte del monorepo [Pleasy](../README.md). Per il quick start completo (Docker) consulta il README principale.

## Architettura

```
src/
├── index.js              # Entry point Express (porta 5001)
├── db.js                 # Connection pool PostgreSQL
├── routes/               # Definizione rotte API (14 moduli)
├── controllers/          # Gestione HTTP request/response
├── services/             # Business logic e validazioni
├── repositories/         # Data access layer (query SQL parametrizzate)
├── middlewares/
│   ├── verifyToken.js    # Autenticazione JWT (cookie + Bearer)
│   ├── checkRole.js      # Controllo ruoli (RBAC)
│   └── rateLimiter.js    # Rate limiting
├── validators/           # Validazione input
└── utils/                # Helper (logger, error handler, Excel parser)
```

**Pattern**: Routes &rarr; Controllers &rarr; Services &rarr; Repositories &rarr; Database

## Sviluppo locale

### Prerequisiti

- **Node.js** &ge; 20
- **PostgreSQL** &ge; 15
- **npm** &ge; 9

### 1. Database

```bash
createdb pleasy
psql -d pleasy -f backend/schema.sql   # dalla root del monorepo
```

### 2. Configura e avvia

```bash
cd backend
cp .env.example .env
# Modifica .env con le credenziali del tuo database
npm install
npm run dev
```

Il server sarà disponibile su `http://localhost:5001`.

### 3. Verifica

```bash
curl http://localhost:5001/api/version
# {"version":"1.0.2"}
```

## API

Tutte le rotte sono sotto il prefisso `/api`.

| Gruppo | Path | Descrizione | Autenticazione |
|--------|------|-------------|----------------|
| Auth | `/api/auth` | Login, logout, refresh token, impersonate | Misto |
| Company | `/api/company` | Gestione azienda | ADMIN |
| User | `/api/user` | Gestione utenti | ADMIN |
| Client | `/api/client` | Gestione clienti | ADMIN, PM |
| Project | `/api/project` | CRUD progetti e assegnazione PM | ADMIN, PM |
| Task | `/api/task` | Gestione task | ADMIN, PM, USER |
| Task ETC | `/api/task-etc` | Estimate To Complete dei task | ADMIN, PM, USER |
| Timesheet | `/api/timesheet` | Registrazione ore | ADMIN, PM, USER |
| Time Off | `/api/timeoff` | Piano ferie e permessi | ADMIN, PM, USER |
| Holidays | `/api/holidays` | Calendario festività | ADMIN |
| Estimate | `/api/estimate` | Stime e preventivi | ADMIN, PM |
| Project Draft | `/api/project-draft` | Bozze progetto (da stime) | ADMIN, PM |
| Reconciliation | `/api/reconciliation` | Quadratura timesheet | ADMIN, PM |
| Dashboard | `/api/dashboard` | Metriche e KPI | ADMIN, PM, USER |

### Autenticazione

L'API utilizza **JWT** con token in cookie httpOnly:

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password1!"}' \
  -c cookies.txt

# Chiamata autenticata
curl http://localhost:5001/api/project \
  -b cookies.txt
```

- **Access token**: 1 ora di validità
- **Refresh token**: 7 giorni di validità
- Supporto sia cookie che header `Authorization: Bearer <token>`

### Ruoli

| Ruolo | Descrizione |
|-------|-------------|
| `ADMIN` | Accesso completo al sistema |
| `PM` | Gestione progetti, task, stime, timesheet |
| `USER` | Consuntivazione ore e visualizzazione propri dati |

## Database

Lo schema completo è in [schema.sql](schema.sql).

### Tabelle principali

```
company ──┬── users
          ├── client ──── project ──┬── task ──── task_timesheet
          │                         ├── project_manager
          │                         └── task_sequence
          ├── holiday_calendar
          ├── user_time_off_plan
          └── timesheet_snapshot

estimate ──┬── estimate_task
           └── project_draft ── task_draft
```

## Variabili d'ambiente

| Variabile | Obbligatoria | Default | Descrizione |
|-----------|:---:|---------|-------------|
| `PORT` | Si | - | Porta del server |
| `PGHOST` | Si | - | Host PostgreSQL |
| `PGPORT` | No | `5432` | Porta PostgreSQL |
| `PGDATABASE` | Si | - | Nome database |
| `PGUSER` | Si | - | Utente database |
| `PGPASSWORD` | Si | - | Password database |
| `JWT_SECRET` | Si | - | Chiave segreta per JWT |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Origini CORS consentite (separate da virgola) |
| `NODE_ENV` | No | `development` | Ambiente di esecuzione |

## Docker

### Solo backend

```bash
docker build -t pleasy-backend .
docker run -p 5001:5001 --env-file .env pleasy-backend
```

Per il deploy full-stack con Docker Compose, vedi il [docker-compose.yml](../docker-compose.yml) nella root del monorepo.

## Stack tecnologico

| Libreria | Versione | Scopo |
|----------|---------|-------|
| Express | 5.x | Web framework |
| pg | 8.x | Client PostgreSQL |
| jsonwebtoken | 9.x | Autenticazione JWT |
| bcrypt | 6.x | Hashing password |
| helmet | 8.x | Security headers |
| cors | 2.x | Gestione CORS |
| compression | 1.x | Compressione gzip |
| multer | 2.x | Upload file |
| exceljs | 4.x | Parsing/generazione Excel |
| winston | 3.x | Logging strutturato |

## Sicurezza

- JWT con cookie httpOnly e flag secure in produzione
- RBAC (Role-Based Access Control) su ogni rotta
- Query SQL parametrizzate (protezione da SQL injection)
- Rate limiting su login e impersonation
- Helmet per security headers (CSP, HSTS, etc.)
- Bcrypt per hashing password
- Isolamento dati per company_id (multi-tenancy)
- Audit logging (login, logout, impersonation)

## Licenza

Distribuito sotto licenza [MIT](../LICENSE).
