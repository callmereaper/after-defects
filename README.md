# AE-Version-Shifter

A production-ready, Dockerized web application that allows users to upload After Effects project files (.aep) and Effect Presets (.ffx), identifies their current version via binary header analysis, and "downgrades" them by patching the version bytes to a user-specified target.

## Features

- **Modern UI**: Glassmorphism aesthetic with drag-and-drop file upload
- **Binary Identification**: Auto-detects AE version from .aep and .ffx files
- **Version Patching**: Hex-patch version bytes without re-saving files
- **Dark/Light Mode**: Seamless theme switching with next-themes
- **Dockerized**: Multi-stage Docker builds for frontend and backend

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Lucide Icons
- TanStack Query

### Backend
- FastAPI (Python 3.11+)
- Python mmap & struct for binary operations
- Gunicorn/Uvicorn for production

## Quick Start

```bash
docker-compose up --build
```

Access the application at `http://localhost:3000`

## Project Structure

```
├── frontend/          # Next.js application
├── backend/           # FastAPI application
├── docker-compose.yml
└── README.md
```

## Supported Versions

- After Effects 2024 (24.x)
- After Effects 2023 (23.x)
- After Effects 2022 (22.x)
- After Effects 18.x
- After Effects 17.x

## License

MIT
