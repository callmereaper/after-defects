#!/bin/bash

# AE-Version-Shifter - Quick Start Script
# This script helps you run the application with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AE-Version-Shifter - Quick Start        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Check Docker Compose (try both v2 and v1 syntax)
if command -v docker compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✅ Docker Compose v2 found${NC}"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}✅ Docker Compose v1 found${NC}"
else
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Building and starting services...${NC}"
echo ""

# Build and start services
$COMPOSE_CMD up --build -d

echo ""
echo -e "${GREEN}✅ Services started successfully!${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker ps | grep -q "aevs-backend"; then
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' aevs-backend 2>/dev/null || echo "starting")
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
            break
        fi
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠️  Backend may still be starting. Check logs with: docker compose logs -f backend${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          🎉 Application Ready!             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC}  http://localhost:3000"
echo -e "${GREEN}🔧 Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}📚 API Docs:${NC}  http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "   View logs:         ${BLUE}docker compose logs -f${NC}"
echo "   Stop services:     ${BLUE}docker compose down${NC}"
echo "   Restart:           ${BLUE}docker compose restart${NC}"
echo "   Rebuild:           ${BLUE}docker compose up --build${NC}"
echo ""
echo -e "${YELLOW}📖 For detailed instructions, see RUN_INSTRUCTIONS.md${NC}"
echo ""
