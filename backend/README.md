# ShopTogether Backend (Python)

AWS Lambda handlers (Python **3.12** on AWS).

## Layout

```
backend/
├── requirements.txt
├── shared/
│   ├── db.py
│   └── auth.py
├── rest_api/
│   ├── lists/       # create, get_all, get_one, update, delete
│   ├── items/       # create, update, toggle, delete
│   └── share/       # create, accept, collaborators, remove
└── websocket/
    ├── connect/
    ├── disconnect/
    ├── message/
    └── broadcast/
```

Each function folder contains `handler.py` with `handler(event, context)` (stubs return HTTP 501 until implemented).

## Local venv

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Deploy is driven from `../infrastructure` (CDK).
