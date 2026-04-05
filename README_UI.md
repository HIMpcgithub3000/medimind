# MediMind UI — Quick start

Prerequisites: Node 20+, Python 3.10+, and the `healthcare_rag` backend with dependencies installed.

## Start backend API

From the `healthcare_rag` directory (parent of this folder):

```bash
cd healthcare_rag
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

## Start frontend

```bash
cd medimind-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to `http://127.0.0.1:8000`.

## Build for production

```bash
npm run build
```

Serve the `dist/` folder with any static host, or put it behind the same origin as your API and configure the API CORS origins accordingly.

## Folder structure

```
medimind-ui/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── api/
    │   ├── client.ts
    │   └── types.ts
    ├── components/
    │   ├── ChatInput.tsx
    │   ├── ConfidenceBadge.tsx
    │   ├── Logo.tsx
    │   ├── MessageBubble.tsx
    │   ├── Navigation.tsx
    │   ├── Sidebar.tsx
    │   ├── SkeletonMessage.tsx
    │   ├── SourceCard.tsx
    │   └── Topbar.tsx
    ├── lib/
    │   └── utils.ts
    ├── pages/
    │   ├── ChatPage.tsx
    │   └── EvaluatePage.tsx
    ├── store/
    │   └── useStore.ts
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    └── vite-env.d.ts
```

MediMind v1.0 — educational use only.
