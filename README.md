# EnterpriseFlow — Financial OS

Platformă web de management financiar și operațional pentru IMM-uri, construită pe stack-ul MERN cu autentificare JWT și control al accesului bazat pe roluri (RBAC).

---

## Pornire rapidă

### 1. Instalare dependențe

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurare variabile de mediu

```bash
# Backend
cp .env.example .env
# Editează .env — adaugă MONGO_URI și JWT_SECRET

# Frontend
cp .env.example .env
# Verifică VITE_API_URL (default: http://localhost:5000/api)
```

### 3. Pornire

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# API pornit pe http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Aplicație la http://localhost:5173
```

---

## Creare conturi demo

Cu backend-ul pornit, rulează în PowerShell:

```powershell
# Manager
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"firstName":"Roman","lastName":"Iuliana","email":"manager@demo.ro","password":"parola123","role":"Manager"}'

# Angajat
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"firstName":"Ion","lastName":"Danila","email":"angajat@demo.ro","password":"parola123","role":"Angajat"}'
```

---

## Logica RBAC — cine face ce

### Angajat (operatorul operațional)

| Acțiune | Permis |
|---------|--------|
| Vizualizare dashboard (KPI-uri + stocuri) | Da |
| Vizualizare grafice analitice | Nu |
| Creare tranzacție nouă | Da |
| Specificare produse din stoc la tranzacție | Da |
| Aprobare / respingere tranzacție | **Nu — 403** |
| Adăugare produs în nomenclator | Da |
| Editare / ștergere produs din stoc | Da |
| Generare raport PDF | **Nu — 403** |
| Vizualizare utilizatori | **Nu — 403** |

### Manager (supervizorul financiar)

| Acțiune | Permis |
|---------|--------|
| Dashboard complet cu grafice analitice | Da |
| Vizualizare toate tranzacțiile | Da |
| Aprobare / respingere tranzacție | Da |
| Modificare directă a stocurilor | **Nu — 403** |
| Vizualizare stocuri (read-only) | Da |
| Generare raport PDF lunar | Da |
| Gestionare utilizatori și roluri | Da |

---

## Fluxul tranzacție → stoc (automatizare critică)

```
[ANGAJAT]                              [MANAGER]
Creează tranzacție tip                 Vede tranzacția în lista
"Stoc produse" și specifică            "În așteptare" și apasă
produsul + cantitatea                  butonul "Aprobă"
        │                                      │
        ▼                                      ▼
Status: "În așteptare"            Sistemul execută automat:
Sold: neschimbat                  1. Status → "Aprobat"
Stoc: neschimbat                  2. Sold actualizat
                                  3. Stoc actualizat:
                                     Cheltuială → stoc CREȘTE
                                     Venit → stoc SCADE
```

La respingere, NIMIC nu se modifică în sold sau stoc.

---

## Structura proiectului

```
enterpriseflow/
├── backend/
│   ├── config/
│   │   └── db.js                      — Conexiune MongoDB
│   ├── controllers/
│   │   ├── authController.js          — Login, register, users
│   │   ├── transactionController.js   — CRUD + aprobare + stats
│   │   └── stockController.js         — CRUD stocuri (Angajat)
│   ├── middleware/
│   │   └── authMiddleware.js          — protect + restrictTo(rol)
│   ├── models/
│   │   ├── User.js                    — Schema cu bcrypt automat
│   │   ├── Transaction.js             — Schema cu referință automată
│   │   └── Stock.js                   — Status virtual (OK/Redus/Critic)
│   ├── routes/
│   │   ├── authRoutes.js              — /api/auth/*
│   │   ├── transactionRoutes.js       — /api/transactions/*
│   │   └── stockRoutes.js             — /api/stocks/*
│   ├── utils/
│   │   └── pdfGenerator.js            — Raport PDF cu PDFKit
│   ├── api.http                       — 20 scenarii de test REST Client
│   ├── server.js                      — Entry point Express
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api.js                     — Axios cu interceptors JWT
    │   ├── context/
    │   │   └── AuthContext.jsx        — Stare globală autentificare
    │   ├── hooks/
    │   │   ├── useAuth.js             — Wrapper AuthContext
    │   │   ├── useTransactions.js     — fetch, approve, reject, create
    │   │   ├── useStocks.js           — CRUD stocuri
    │   │   ├── useDashboard.js        — Stats + downloadReport
    │   │   ├── useToast.js            — Notificări success/error
    │   │   ├── useDebounce.js         — Delay pentru search
    │   │   └── useLocalStorage.js     — Persistență preferințe UI
    │   ├── components/
    │   │   ├── Sidebar.jsx            — Navigație laterală
    │   │   ├── Navbar.jsx             — Header cu search și acțiuni
    │   │   ├── DashboardCard.jsx      — Card KPI reutilizabil
    │   │   ├── TransactionRow.jsx     — Rând tranzacție
    │   │   ├── ProtectedRoute.jsx     — Guard rute private
    │   │   └── Toast.jsx              — Sistem notificări
    │   └── pages/
    │       ├── Login.jsx              — Autentificare cu ColorBends bg
    │       ├── Dashboard.jsx          — Tablou de bord (grafice doar Manager)
    │       ├── Tranzactii.jsx         — Flux aprobare ierarhic
    │       ├── Stocuri.jsx            — CRUD Angajat / read-only Manager
    │       ├── Rapoarte.jsx           — Descărcare PDF (Manager only)
    │       └── Utilizatori.jsx        — Gestionare conturi (Manager only)
    ├── tailwind.config.js
    ├── vite.config.js
    ├── .env.example
    └── package.json
```

---

## Endpoint-uri API

### Auth — `/api/auth`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| POST | `/register` | Public | Creare cont |
| POST | `/login` | Public | Autentificare |
| GET | `/me` | Oricine autentificat | Profil curent |
| GET | `/users` | Manager | Lista utilizatori |
| PATCH | `/users/:id/role` | Manager | Schimbare rol |
| PATCH | `/users/:id/toggle-active` | Manager | Activare/dezactivare cont |

### Tranzacții — `/api/transactions`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| GET | `/` | Ambele (filtrat) | Angajat vede ale lui, Manager vede toate |
| POST | `/` | Ambele | Creare tranzacție — status automat "În așteptare" |
| GET | `/:id` | Ambele (filtrat) | Detalii tranzacție |
| PATCH | `/:id/approve` | **Manager** | Aprobare + actualizare stoc automat |
| PATCH | `/:id/reject` | **Manager** | Respingere |
| GET | `/stats/dashboard` | Ambele (filtrat) | Statistici dashboard |
| GET | `/report/monthly` | **Manager** | Raport PDF descărcabil |

### Stocuri — `/api/stocks`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| GET | `/` | Ambele | Lista produse |
| GET | `/:id` | Ambele | Detalii produs |
| POST | `/` | **Angajat** | Adăugare produs în nomenclator |
| PATCH | `/:id` | **Angajat** | Actualizare produs / ajustare manuală stoc |
| DELETE | `/:id` | **Angajat** | Ștergere produs |

---

## Testare cu VS Code REST Client

Deschide `backend/api.http` în VS Code (extensia **REST Client** de Huachao Mao).

Conține 20 de scenarii ordonate, inclusiv teste negative:
- Angajat încearcă să aprobe → **403**
- Manager încearcă să adauge produs → **403**
- Angajat încearcă să genereze raport → **403**
- Utilizator neautentificat → **401**

---

## Stack tehnic

| Layer | Tehnologie |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Icoane | Lucide React |
| Grafice | Recharts |
| HTTP client | Axios cu interceptors JWT |
| State | React Context API + Custom Hooks |
| Backend | Node.js + Express.js |
| Bază de date | MongoDB + Mongoose ODM |
| Autentificare | JWT (jsonwebtoken) + bcryptjs |
| Securitate | Helmet + CORS |
| PDF | PDFKit |
| Background animat | Three.js (ColorBends — pagina Login) |

---

## Deploy

### Backend (Render)
1. Push repo pe GitHub
2. New Web Service → build: `npm install`, start: `npm start`
3. Variabile de mediu: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend (Vercel)
1. Import repo
2. Framework preset: Vite
3. Variabile de mediu: `VITE_API_URL=https://your-api.onrender.com/api`
