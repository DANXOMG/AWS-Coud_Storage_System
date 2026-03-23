#!/bin/bash
echo "[!] Deteniendo stack..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../AWS-Services/EC2-Ubuntu/docker-infraestructure"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$COMPOSE_DIR"

echo -e "${BLUE}[+] Deteniendo contenedores de producción...${NC}"
docker compose down 2>/dev/null

echo -e "${BLUE}[+] Deteniendo contenedores de testing...${NC}"
docker compose --profile testing down 2>/dev/null

echo -e "${GREEN}[+] Todos los contenedores detenidos${NC}"
