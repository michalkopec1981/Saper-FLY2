#!/bin/bash

# 🗄️ Skrypt do utworzenia bazy PostgreSQL dla Saper QR na Fly.io

set -e

echo "╔════════════════════════════════════════╗"
echo "║   🗄️  PostgreSQL Setup - Saper QR     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl nie jest zainstalowane!${NC}"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${RED}❌ Musisz się zalogować: flyctl auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} flyctl gotowe"
echo ""

# Get app name from fly.toml
APP_NAME=$(grep "^app = " fly.toml | cut -d"'" -f2 | cut -d'"' -f2)

if [ -z "$APP_NAME" ]; then
    echo -e "${YELLOW}Nie znaleziono nazwy aplikacji w fly.toml${NC}"
    read -p "Podaj nazwę aplikacji: " APP_NAME
fi

echo -e "${BLUE}Aplikacja:${NC} $APP_NAME"
echo ""

# Check if app exists
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${RED}❌ Aplikacja '$APP_NAME' nie istnieje!${NC}"
    echo "Dostępne aplikacje:"
    flyctl apps list
    exit 1
fi

echo -e "${GREEN}✓${NC} Aplikacja istnieje"
echo ""

# Database name
DB_NAME="${APP_NAME}-db"

echo "═══════════════════════════════════════"
echo "Tworzenie bazy PostgreSQL"
echo "═══════════════════════════════════════"
echo -e "${BLUE}Nazwa bazy:${NC} $DB_NAME"
echo -e "${BLUE}Region:${NC} fra (Frankfurt)"
echo -e "${BLUE}Rozmiar VM:${NC} shared-cpu-1x (darmowy tier)"
echo -e "${BLUE}Rozmiar dysku:${NC} 1GB"
echo ""

read -p "Kontynuować? [y/n]: " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Anulowano"
    exit 0
fi

echo ""
echo -e "${YELLOW}Tworzenie bazy PostgreSQL...${NC}"
echo "To może potrwać kilka minut..."
echo ""

# Create Postgres database
if flyctl postgres create \
    --name "$DB_NAME" \
    --region fra \
    --vm-size shared-cpu-1x \
    --volume-size 1 \
    --initial-cluster-size 1; then

    echo ""
    echo -e "${GREEN}✓${NC} Baza danych utworzona!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Nie udało się utworzyć bazy danych${NC}"
    echo ""
    echo "Możliwe przyczyny:"
    echo "  - Baza o tej nazwie już istnieje"
    echo "  - Przekroczono limit darmowego tier"
    echo "  - Problem z siecią"
    echo ""
    echo "Sprawdź istniejące bazy:"
    echo "  flyctl postgres list"
    exit 1
fi

# Wait a moment for the database to be ready
echo "Czekam 10 sekund na inicjalizację bazy..."
sleep 10

# Attach database to app
echo ""
echo "═══════════════════════════════════════"
echo -e "${YELLOW}Podłączanie bazy do aplikacji...${NC}"
echo "═══════════════════════════════════════"
echo ""

if flyctl postgres attach "$DB_NAME" -a "$APP_NAME"; then
    echo ""
    echo -e "${GREEN}✓${NC} Baza podłączona do aplikacji!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Nie udało się podłączyć bazy${NC}"
    echo ""
    echo "Spróbuj ręcznie:"
    echo "  flyctl postgres attach $DB_NAME -a $APP_NAME"
    exit 1
fi

# Show connection info
echo "═══════════════════════════════════════"
echo "Informacje o bazie danych"
echo "═══════════════════════════════════════"
echo ""

flyctl postgres list | grep "$DB_NAME" || true
echo ""

# Check if DATABASE_URL is set
echo -e "${YELLOW}Sprawdzanie zmiennej DATABASE_URL...${NC}"
if flyctl secrets list -a "$APP_NAME" | grep -q "DATABASE_URL"; then
    echo -e "${GREEN}✓${NC} DATABASE_URL jest ustawiona"
else
    echo -e "${RED}⚠${NC}  DATABASE_URL nie jest widoczna w secrets (to normalne jeśli jest attachowana)"
fi

echo ""
echo "═══════════════════════════════════════"
echo "Czy chcesz teraz zrestartować aplikację?"
echo "(Wymagane, aby aplikacja użyła nowej bazy)"
echo "═══════════════════════════════════════"
read -p "[y/n]: " RESTART

if [[ "$RESTART" == "y" || "$RESTART" == "Y" ]]; then
    echo ""
    echo -e "${YELLOW}Restartowanie aplikacji...${NC}"
    flyctl apps restart -a "$APP_NAME"
    echo ""
    echo -e "${GREEN}✓${NC} Aplikacja zrestartowana"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 PostgreSQL GOTOWE! 🎉       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "📋 Przydatne komendy:"
echo ""
echo "  # Połącz się z bazą przez psql"
echo "  flyctl postgres connect -a $DB_NAME"
echo ""
echo "  # Zobacz logi bazy danych"
echo "  flyctl logs -a $DB_NAME"
echo ""
echo "  # Sprawdź status bazy"
echo "  flyctl status -a $DB_NAME"
echo ""
echo "  # Sprawdź użycie zasobów"
echo "  flyctl postgres db list -a $DB_NAME"
echo ""
echo "  # Backup bazy"
echo "  flyctl postgres backup list -a $DB_NAME"
echo ""
echo "  # Sprawdź connection string (credentials)"
echo "  flyctl postgres users list -a $DB_NAME"
echo ""
echo "🔗 Twoja aplikacja:"
echo "  https://${APP_NAME}.fly.dev"
echo ""
