# Phase 01: Project Setup

## Context Links

- [Parent Plan](./plan.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)
- [Frontend Research](./research/researcher-02-vite-react-frontend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 3h |
| Implementation Status | pending |
| Review Status | pending |

Initialize monorepo structure with backend (Express + TypeScript) and frontend (Vite + React + TypeScript). Configure Firebase, Tailwind CSS, and shadcn/ui.

## Key Insights

- Use ESM modules with Node 18+ for modern syntax
- shadcn/ui copies components into codebase (not npm dependency)
- Firebase Admin SDK for backend, Firebase Client SDK for frontend
- Strict TypeScript config for type safety

## Requirements

### Functional
- Monorepo with `/backend` and `/frontend` directories
- Both projects compile without errors
- Environment variables configured
- Firebase connection established

### Non-Functional
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Hot reload working for both

## Architecture

```
employee-task-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Related Code Files

### Files to Create
- `/backend/package.json`
- `/backend/tsconfig.json`
- `/backend/src/index.ts`
- `/backend/src/config/firebase-admin-config.ts`
- `/backend/.env.example`
- `/frontend/` (via Vite template)
- `/frontend/src/lib/firebase-client-config.ts`
- `/.gitignore`
- `/.env.example`
- `/README.md`

## Implementation Steps

### 1. Initialize Backend (Express + TypeScript)

```bash
mkdir backend && cd backend
npm init -y
npm install express cors helmet dotenv firebase-admin jsonwebtoken
npm install -D typescript @types/express @types/node @types/cors @types/jsonwebtoken ts-node-dev
npx tsc --init
```

### 2. Configure Backend TypeScript

`backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 3. Create Backend Entry Point

`backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4. Initialize Frontend (Vite + React + TypeScript)

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install axios socket.io-client react-router-dom firebase
npm install -D @types/react-router-dom
```

### 6. Setup Tailwind CSS + shadcn/ui

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npx shadcn@latest add button input form card dialog toast
```

### 7. Create Firebase Config Files

Backend (`backend/src/config/firebase-admin-config.ts`):
```typescript
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

const app = initializeApp({ credential: cert(serviceAccount) });
export const db = getFirestore(app);
```

Frontend (`frontend/src/lib/firebase-client-config.ts`):
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 8. Create Environment Files

`.env.example`:
```
# Backend
PORT=3001
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
JWT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
EMAIL_USER=
EMAIL_PASS=

# Frontend (VITE_ prefix)
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

### 9. Configure package.json Scripts

Backend `package.json`:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 10. Create .gitignore

```
node_modules/
dist/
.env
*.log
.DS_Store
```

## Todo List

- [ ] Create backend folder structure
- [ ] Initialize backend with Express + TypeScript
- [ ] Create backend tsconfig.json
- [ ] Create backend entry point
- [ ] Initialize frontend with Vite
- [ ] Install frontend dependencies
- [ ] Setup Tailwind CSS
- [ ] Setup shadcn/ui components
- [ ] Create Firebase Admin config (backend)
- [ ] Create Firebase Client config (frontend)
- [ ] Create .env.example files
- [ ] Create .gitignore
- [ ] Verify both projects compile
- [ ] Test health endpoint

## Success Criteria

- [ ] `npm run dev` works in both `/backend` and `/frontend`
- [ ] Backend responds to `GET /health`
- [ ] Frontend renders without errors
- [ ] TypeScript compiles with no errors
- [ ] Firebase SDK imports without errors

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Firebase credentials invalid | Medium | High | Test connection early |
| Package version conflicts | Low | Medium | Lock versions in package.json |
| ESM/CommonJS issues | Medium | Medium | Use NodeNext module resolution |

## Security Considerations

- Never commit `.env` files
- Use `.env.example` as template
- Firebase private key must stay secret
- CORS whitelist frontend URL only

## Next Steps

After completion:
1. Proceed to [Phase 02: Backend Core](./phase-02-backend-core.md)
2. Test Firebase connection with sample read/write
