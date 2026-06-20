# EnterpriseFlow - SO Financiar

Platformă web de management financiar și operațional pentru IMM-uri, construită pe stack-ul MERN cu autentificare JWT și control al accesului bazat pe roluri (RBAC).

🔗 **Live demo:** [enterprise-flow-iota.vercel.app](https://enterprise-flow-iota.vercel.app)
🔗 **API:** [enterpriseflow-xft3.onrender.com](https://enterpriseflow-xft3.onrender.com)

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
# Editează .env — adaugă MONGO_URI, JWT_SECRET, GEMINI_API_KEY

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
| Specificare produse din stoc la tranzacție (inclusiv produs nou) | Da |
| Aprobare / respingere tranzacție | **Nu — 403** |
| Adăugare produs în nomenclator | Da |
| Editare / ștergere produs din stoc (dacă nu are tranzacții asociate) | Da |
| Generare raport PDF | **Nu — 403** |
| Vizualizare utilizatori | **Nu — 403** |
| Vizualizare audit log (doar acțiunile proprii) | Da |
| Scanare factură (OCR) | Da |
| Asistent AI | Da |

### Manager (supervizorul financiar)

| Acțiune | Permis |
|---------|--------|
| Dashboard complet cu grafice analitice | Da |
| Vizualizare toate tranzacțiile | Da |
| Aprobare / respingere tranzacție (cu notă opțională) | Da |
| Modificare directă a stocurilor | **Nu — 403** |
| Vizualizare stocuri (read-only) | Da |
| Generare raport PDF lunar | Da |
| Gestionare utilizatori și roluri | Da |
| Vizualizare audit log (toate acțiunile, filtrabil pe utilizator) | Da |

---

## Fluxul tranzacție → stoc (automatizare critică)

```
[ANGAJAT]                              [MANAGER]
Creează tranzacție tip                 Vede tranzacția în lista
"Produse" — selectează produs          "În așteptare" și apasă
existent SAU adaugă unul nou           butonul "Aprobă"
direct din formular + cantitatea               │
        │                                      ▼
        ▼                              Sistemul execută automat:
Status: "În așteptare"                 1. Status → "Aprobat"
Sold: neschimbat                       2. Sold actualizat
Stoc: neschimbat                       3. Stoc actualizat:
                                           Cheltuială → stoc CREȘTE
                                           Venit → stoc SCADE
```

La respingere, NIMIC nu se modifică în sold sau stoc.

Un produs din stoc nu poate fi șters dacă are tranzacții asociate — previne referințe rupte (`stockController.js`).

---

## Integritate și consistență a datelor (ACID parțial în Mongoose)

MongoDB / Mongoose nu garantează ACID complet implicit pe operații multi-document, așa că anumite puncte critice ale aplicației au fost tratate explicit:

- **Generare referință tranzacție (`Counter.js`)** — în loc să se caute ultima tranzacție salvată și să i se incrementeze manual numărul (vulnerabil la race conditions sub concurență), se folosește un document `Counter` dedicat și operația atomică `findByIdAndUpdate` cu `$inc` + `upsert`. MongoDB execută acest increment ca o singură operație indivizibilă la nivel de document, eliminând posibilitatea ca două tranzacții salvate simultan să primească aceeași referință, chiar și în cazul unui crash al serverului între citire și scriere.

```js
counterSchema.statics.next = async function (id) {
  const doc = await this.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};
```

- **Aprobare tranzacție** — actualizarea stocului și schimbarea statusului tranzacției sunt verificate secvențial cu validare explicită a cantității disponibile înainte de scriere, prevenind stoc negativ.
- **Protecție la ștergere** — `Stock.deleteOne` verifică în prealabil existența tranzacțiilor asociate (`Transaction.exists({ stockItem })`) pentru a preveni orfanizarea referințelor.

---

## Testare automată (Jest)

Suită de teste unitare care acoperă logica de business critică, izolată de baza de date reală printr-un MongoDB în memorie (`mongodb-memory-server`).

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

| Fișier | Acoperă |
|--------|---------|
| `backend/tests/auth.test.js` | Hash bcrypt, comparare parolă, cont dezactivat |
| `backend/tests/stock.test.js` | Status dinamic (OK/Redus/Critic), protecție la ștergere |
| `backend/tests/transaction.test.js` | Status inițial, generare referință unică/atomică |
| `backend/tests/approval.test.js` | Aprobare → stoc actualizat, respingere → stoc neschimbat, blocare re-aprobare |
| `frontend/src/tests/ProtectedRoute.test.js` | Acces blocat fără autentificare, spinner la loading |
| `frontend/src/tests/DashboardCard.test.js` | Afișare corectă valoare, etichetă, tag |

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
│   │   ├── stockController.js         — CRUD stocuri (Angajat)
│   │   ├── auditController.js         — Listare/filtrare audit log
│   │   ├── ocrController.js           — Scanare factură (Gemini)
│   │   └── aiAssistantController.js   — Chat asistent AI
│   ├── middleware/
│   │   ├── authMiddleware.js          — protect + restrictTo(rol)
│   │   └── auditLogger.js             — Logging automat acțiuni CRUD
│   ├── models/
│   │   ├── User.js                    — Schema cu bcrypt automat
│   │   ├── Transaction.js             — Schema cu referință generată atomic
│   │   ├── Stock.js                   — Status virtual (OK/Redus/Critic)
│   │   ├── Counter.js                 — Contor atomic pentru referințe unice
│   │   └── AuditLog.js                — Istoric acțiuni utilizatori
│   ├── routes/
│   │   ├── authRoutes.js              — /api/auth/*
│   │   ├── transactionRoutes.js       — /api/transactions/*
│   │   ├── stockRoutes.js             — /api/stocks/*
│   │   ├── audit.js                   — /api/audit/*
│   │   ├── ocrRoutes.js               — /api/ocr/*
│   │   └── aiAssistantRoutes.js       — /api/assistant/*
│   ├── tests/                         — Suită Jest (backend)
│   ├── utils/
│   │   └── pdfGenerator.js            — Raport PDF cu PDFKit
│   ├── api.http                       — Scenarii de test REST Client
│   ├── server.js                      — Entry point Express
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api.js                     — Axios cu baseURL din VITE_API_URL
    │   ├── context/
    │   │   └── AuthContext.jsx        — Stare globală autentificare
    │   ├── hooks/
    │   │   ├── useAuth.js             — Wrapper AuthContext
    │   │   ├── useTransactions.js     — fetch, approve, reject, create
    │   │   ├── useStocks.js           — CRUD stocuri
    │   │   ├── useDashboard.js        — Stats + downloadReport
    │   │   ├── useWorkLogs.js         — Pontaj din audit log (LOGIN/LOGOUT)
    │   │   ├── useToast.js            — Notificări success/error
    │   │   └── useDebounce.js         — Delay pentru search
    │   ├── components/
    │   │   ├── Sidebar.jsx            — Navigație laterală
    │   │   ├── Navbar.jsx             — Header cu search și acțiuni
    │   │   ├── DashboardCard.jsx      — Card KPI reutilizabil
    │   │   ├── TransactionRow.jsx     — Rând tranzacție
    │   │   ├── ProtectedRoute.jsx     — Guard rute private
    │   │   └── Toast.jsx              — Sistem notificări
    │   ├── pages/
    │   │   ├── Login.jsx              — Autentificare cu fundal animat (Three.js)
    │   │   ├── Dashboard.jsx          — Tablou de bord (grafice doar Manager)
    │   │   ├── Tranzactii.jsx         — Flux aprobare ierarhic + scanare OCR + produs nou inline
    │   │   ├── Stocuri.jsx            — CRUD Angajat / read-only Manager
    │   │   ├── AuditLog.jsx           — Istoric acțiuni, filtrabil
    │   │   └── Utilizatori.jsx        — Gestionare conturi (Manager only)
    │   └── tests/                     — Suită Jest (frontend, RTL)
    ├── vercel.json                    — Rewrite SPA (fix 404 la refresh)
    ├── babel.config.cjs
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
| PATCH | `/:id` | Proprietar | Editare tranzacție proprie, doar dacă nu e aprobată |
| PATCH | `/:id/approve` | **Manager** | Aprobare + actualizare stoc automat |
| PATCH | `/:id/reject` | **Manager** | Respingere |
| DELETE | `/:id` | Proprietar | Ștergere tranzacție proprie, doar dacă nu e aprobată |
| GET | `/stats/dashboard` | Ambele (filtrat) | Statistici dashboard |
| GET | `/report/monthly` | **Manager** | Raport PDF descărcabil |

### Stocuri — `/api/stocks`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| GET | `/` | Ambele | Lista produse |
| GET | `/:id` | Ambele | Detalii produs |
| POST | `/` | **Angajat** | Adăugare produs în nomenclator (manual sau din formularul de tranzacție) |
| PATCH | `/:id` | **Angajat** | Actualizare produs / ajustare manuală stoc |
| DELETE | `/:id` | **Angajat** | Ștergere produs — blocată dacă există tranzacții asociate |

### Audit Log — `/api/audit`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| GET | `/` | Ambele (filtrat) | Listă acțiuni, paginată și filtrabilă pe entitate/acțiune/utilizator/dată |
| GET | `/users` | Manager | Listă utilizatori pentru filtrul de audit |

### OCR — `/api/ocr`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| POST | `/scan` | Ambele | Extrage date din imagine/PDF factură via Gemini |

### Asistent AI — `/api/assistant`

| Metodă | Rută | Acces | Descriere |
|--------|------|-------|-----------|
| POST | `/chat` | Ambele | Chat contextual cu asistentul AI |

---

## Testare cu VS Code REST Client

Deschide `backend/api.http` în VS Code (extensia **REST Client** de Huachao Mao).

Conține scenarii ordonate, inclusiv teste negative:
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
| HTTP client | Axios cu baseURL configurabil |
| State | React Context API + Custom Hooks |
| Backend | Node.js + Express.js |
| Bază de date | MongoDB Atlas + Mongoose ODM |
| Autentificare | JWT (jsonwebtoken) + bcryptjs |
| Securitate | Helmet + CORS + rate limiting (auth) |
| AI / OCR | Google Gemini API |
| PDF | PDFKit |
| Testare | Jest + mongodb-memory-server + React Testing Library |
| Background animat | Three.js (Login) |

---

## Deploy

### Backend (Render)
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Variabile de mediu:** `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`, `PORT`

### Frontend (Vercel)
- **Root Directory:** `frontend`
- **Framework preset:** Vite
- **Variabile de mediu:** `VITE_API_URL=https://your-api.onrender.com/api`
- **`vercel.json`** — necesar pentru rewrite SPA, altfel refresh-ul pe orice rută diferită de `/` returnează 404:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
