# ShopTogether

Collaborative lists with real-time updates and email sharing.

## Layout

```
ShopTogether/
├── infrastructure/     # AWS CDK (Python)
├── backend/            # Python Lambda handlers
├── frontend/           # (later) web app
└── plan/               # local docs (gitignored)
```

## Stack

- **Region:** `eu-central-1`
- **Backend:** Python 3.12 on Lambda
- **Infra:** AWS CDK (Python); `cdk` CLI needs Node.js

See `infrastructure/README.md` and `backend/README.md`.
