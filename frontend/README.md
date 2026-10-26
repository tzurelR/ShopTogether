# ShopTogether frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (the port CORS allows)
npm run build      # static files in dist/
```

`.env.local` holds the backend addresses from `infrastructure/outputs.json`; see `.env.example`.

Layout: `src/pages/` one page per route, `src/components/` one component per file,
`src/styles/` tokens (light + dark) and shared classes.
