# Astra Test 1

Testing and validation platform with user authentication and Fernet data encryption.

## Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2, PostgreSQL, JWT auth, Fernet encryption
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Infra**: Docker Compose

## Quick Start

### 1. Environment

```bash
cp .env.example .env
```

Generate secrets:

```bash
# JWT secret
python -c "import secrets; print(secrets.token_hex(32))"

# Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste both into `.env`.

### 2. Docker

```bash
docker compose up --build
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

### 3. Local dev (without Docker)

**Backend:**

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Reference

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Get JWT token |
| `GET` | `/auth/me` | Current user |

### Test Runs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/test-runs` | List runs |
| `POST` | `/api/test-runs` | Create run |
| `POST` | `/api/test-runs/{id}/execute` | Execute run |
| `DELETE` | `/api/test-runs/{id}` | Delete run |

### Encryption

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/encrypt` | Encrypt and store data |
| `POST` | `/api/decrypt` | Decrypt a record |
| `GET` | `/api/encrypted-records` | List records |

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # User, TestRun, EncryptedRecord
│   ├── routers/
│   │   ├── auth.py          # /register /login /me
│   │   └── api.py           # test run + encryption endpoints
│   ├── services/
│   │   └── core.py          # EncryptionService, TestRunService
│   └── requirements.txt
├── frontend/
│   └── src/app/
│       ├── page.tsx              # Auth landing (login/register)
│       └── dashboard/page.tsx    # Main dashboard
├── docker-compose.yml
├── Dockerfile.backend
└── .env.example
```
