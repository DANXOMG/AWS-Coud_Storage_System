#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/../docker-infraestructure/Nginx/ssl"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[+] Generando certificados SSL autofirmados...${NC}"

# Obtener IP pública via IMDSv2
TOKEN_IMDS=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN_IMDS" \
  http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)

if [ -z "$PUBLIC_IP" ]; then
    echo -e "${RED}[!] No se pudo obtener la IP pública. Usando localhost.${NC}"
    PUBLIC_IP="localhost"
fi

echo -e "${BLUE}[+] IP pública detectada: $PUBLIC_IP${NC}"

# Crear directorio
mkdir -p "$SSL_DIR"

# Eliminar certificados anteriores
rm -f "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
echo -e "${BLUE}[+] Certificados anteriores eliminados${NC}"

# Generar nuevo certificado con SAN
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -subj "/C=ES/ST=Madrid/L=Madrid/O=ConTrolCloud/CN=$PUBLIC_IP" \
    -addext "subjectAltName=IP:$PUBLIC_IP,DNS:localhost"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[+] Certificados SSL generados correctamente${NC}"
    echo ""
    echo "    Ubicación: $SSL_DIR"
    echo "    cert.pem  — certificado (válido 365 días)"
    echo "    key.pem   — clave privada"
    echo "    CN/SAN    — $PUBLIC_IP"
    echo ""
    echo -e "${BLUE}[!] Recuerda reiniciar Nginx:${NC}"
    echo "    cd $SCRIPT_DIR/../docker-infraestructure && docker compose restart nginx"
else
    echo -e "${RED}[!] Error al generar certificados SSL${NC}"
    exit 1
fi
