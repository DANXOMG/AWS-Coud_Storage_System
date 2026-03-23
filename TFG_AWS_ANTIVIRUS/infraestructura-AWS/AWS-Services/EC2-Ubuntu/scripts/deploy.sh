#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker-infraestructure"

echo "================================================"
echo "========= Iniciando despliegue TFG_AWS_ANTIVIRUS =========="
echo "================================================"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[+] $1${NC}"; }
log_success() { echo -e "${GREEN}[+] $1${NC}"; }
log_error()   { echo -e "${RED}[!] $1${NC}"; }

if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    log_error "Docker Compose v2 no está instalado."
    exit 1
fi

log_success "Docker y Docker Compose están instalados"

log_info "Verificando credenciales AWS (LabRole)..."
TOKEN_IMDS=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)
ROLE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN_IMDS" \
  http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null)

if [ -z "$ROLE" ]; then
    log_error "LabRole no detectado. Asigna el LabRole a la instancia EC2."
    exit 1
fi
log_success "LabRole detectado: $ROLE"

cd "$COMPOSE_DIR"

echo ""
echo "Selecciona el modo de despliegue:"
echo "1) Producción (todos los servicios)"
echo "2) Producción + Testing (incluye antivirus con puerto expuesto)"
read -p "Ingresa tu opción [1-2]: " mode

if [ "$mode" == "1" ]; then
    log_info "Desplegando en modo PRODUCCIÓN..."
    docker compose down 2>/dev/null
    docker compose build
    if [ $? -ne 0 ]; then log_error "Error al construir las imágenes"; exit 1; fi
    log_success "Imágenes construidas exitosamente"
    docker compose up -d db
    sleep 15
    docker compose up -d api nginx
    if [ $? -eq 0 ]; then
        log_success "¡Stack desplegado exitosamente!"
        echo ""
        echo "[+] API disponible en:   https://localhost/api/health"
        echo "[+] HTTP redirige a HTTPS automáticamente"
        echo ""
        echo "Comandos útiles:"
        echo "  - Ver logs:    docker compose logs -f"
        echo "  - Detener:     $SCRIPT_DIR/stop.sh"
        echo "  - Estado:      docker compose ps"
    else
        log_error "Error al levantar los servicios"; exit 1
    fi

elif [ "$mode" == "2" ]; then
    log_info "Desplegando en modo PRODUCCIÓN + TESTING..."
    docker compose down 2>/dev/null
    docker compose build
    docker compose --profile testing build
    if [ $? -ne 0 ]; then log_error "Error al construir las imágenes"; exit 1; fi
    log_success "Imágenes construidas exitosamente"
    docker compose up -d db
    sleep 15
    docker compose up -d api nginx
    docker compose --profile testing up -d antivirus
    if [ $? -eq 0 ]; then
        log_success "¡Stack completo desplegado exitosamente!"
        echo ""
        echo "[+] API disponible en:       https://localhost/api/health"
        echo "[+] Antivirus disponible en: http://localhost:5000/scan"
        echo ""
        echo "Comandos útiles:"
        echo "  - Ver logs:    docker compose logs -f"
        echo "  - Detener:     $SCRIPT_DIR/stop.sh"
        echo "  - Estado:      docker compose ps"
    else
        log_error "Error al levantar los servicios"; exit 1
    fi

else
    log_error "Opción inválida"; exit 1
fi

echo ""
log_success "Despliegue completado"
