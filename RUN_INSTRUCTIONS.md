# AE-Version-Shifter - Quick Start Guide

## Prerequisites

Make sure you have the following installed:
- **Docker** (v20.10+)
- **Docker Compose** (v2.0+) or Docker Desktop (includes Compose)

Verify installation:
```bash
docker --version
docker compose version
```

---

## Option 1: Run with Docker Compose (Recommended)

### Step 1: Build and Start All Services

From the project root directory (`/workspace`):

```bash
docker compose up --build
```

Or if you have the older `docker-compose` command:

```bash
docker-compose up --build
```

### Step 2: Access the Application

Once the services are running:
- **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser
- **Backend API**: Available at [http://localhost:8000](http://localhost:8000)
- **API Docs**: Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 3: Stop the Services

To stop everything:

```bash
docker compose down
```

To stop and remove all volumes (clean slate):

```bash
docker compose down -v
```

---

## Option 2: Run Services Separately (Development)

### Backend Only

```bash
cd backend
docker build -t aevs-backend .
docker run -p 8000:8000 --name aevs-backend aevs-backend
```

### Frontend Only

```bash
cd frontend
docker build -t aevs-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 --name aevs-frontend aevs-frontend
```

---

## Option 3: Run Locally (Without Docker)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Set the API URL in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Troubleshooting

### Port Already in Use

If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port to 3001
```

### Backend Health Check Failing

The backend includes a health check endpoint. If it fails:
```bash
docker logs aevs-backend
```

### Rebuild After Code Changes

```bash
docker compose up --build --force-recreate
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

---

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐
│   Frontend      │─────▶│    Backend       │
│   Next.js:3000  │      │   FastAPI:8000   │
│   (React/TS)    │◀─────│   (Python)       │
└─────────────────┘      └──────────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ /tmp/uploads │
                         │ (Temp Files) │
                         └──────────────┘
```

**Network**: Both containers communicate via `aevs-network` bridge network.

---

## Features

✅ Drag-and-drop file upload (.aep, .ffx)
✅ Auto-detect After Effects version
✅ Patch version bytes (hex-patch)
✅ Target version selection (2024, 2023, 2022, etc.)
✅ Light/Dark mode theme
✅ Real-time upload progress
✅ Success animations
✅ Temporary file cleanup
✅ 500MB file size limit
✅ MIME-type validation

---

## Production Deployment

For production, update `docker-compose.yml`:

```yaml
services:
  frontend:
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://your-api-domain.com
  
  backend:
    environment:
      - MAX_FILE_SIZE=524288000
```

Consider adding:
- HTTPS/TLS termination (nginx, traefik)
- Reverse proxy
- Persistent storage for uploads
- Rate limiting
- Authentication

---

Enjoy using AE-Version-Shifter! 🎉
