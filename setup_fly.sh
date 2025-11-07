#!/bin/bash

# 🚀 Fly.io Setup Script dla Saper QR
# Ten skrypt pomoże Ci szybko skonfigurować aplikację na Fly.io

set -e  # Exit on error

echo "╔════════════════════════════════════════╗"
echo "║   🚀 Fly.io Setup - Saper QR          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl nie jest zainstalowane!${NC}"
    echo ""
    echo "Zainstaluj flyctl:"
    echo "  Linux/macOS: curl -L https://fly.io/install.sh | sh"
    echo "  Windows:     iwr https://fly.io/install.ps1 -useb | iex"
    echo "  Homebrew:    brew install flyctl"
    exit 1
fi

echo -e "${GREEN}✓${NC} flyctl zainstalowane"
echo ""

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Musisz się zalogować do Fly.io"
    echo ""
    flyctl auth login
    echo ""
fi

echo -e "${GREEN}✓${NC} Zalogowano do Fly.io"
echo ""

# Get app name
echo "═══════════════════════════════════════"
echo "Podaj nazwę aplikacji (musi być unikalna)"
echo "Przykład: saper-qr-app-2025"
echo "═══════════════════════════════════════"
read -p "Nazwa aplikacji: " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}❌ Nazwa aplikacji nie może być pusta!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Tworzenie aplikacji: $APP_NAME${NC}"
echo ""

# Create app
if flyctl apps create "$APP_NAME" --org personal; then
    echo -e "${GREEN}✓${NC} Aplikacja utworzona"
else
    echo -e "${RED}❌ Nie udało się utworzyć aplikacji${NC}"
    echo "Możliwe przyczyny:"
    echo "  - Nazwa jest już zajęta"
    echo "  - Brak uprawnień"
    exit 1
fi

echo ""

# Update fly.toml
echo -e "${YELLOW}Aktualizowanie fly.toml...${NC}"
sed -i.bak "s/app = .*/app = '$APP_NAME'/" fly.toml
echo -e "${GREEN}✓${NC} fly.toml zaktualizowany"
echo ""

# Ask about database
echo "═══════════════════════════════════════"
echo "Czy chcesz utworzyć bazę PostgreSQL?"
echo "  [y] Tak - PostgreSQL (zalecane dla produkcji)"
echo "  [n] Nie - SQLite (łatwiejsze, wystarczające dla małych aplikacji)"
echo "═══════════════════════════════════════"
read -p "Wybór [y/n]: " CREATE_DB

if [[ "$CREATE_DB" == "y" || "$CREATE_DB" == "Y" ]]; then
    echo ""
    echo -e "${YELLOW}Tworzenie bazy PostgreSQL...${NC}"
    DB_NAME="${APP_NAME}-db"

    if flyctl postgres create --name "$DB_NAME" --region fra --vm-size shared-cpu-1x --volume-size 1; then
        echo -e "${GREEN}✓${NC} Baza danych utworzona"
        echo ""
        echo -e "${YELLOW}Podłączanie bazy do aplikacji...${NC}"
        flyctl postgres attach "$DB_NAME" -a "$APP_NAME"
        echo -e "${GREEN}✓${NC} Baza podłączona"
    else
        echo -e "${RED}❌ Nie udało się utworzyć bazy danych${NC}"
    fi
else
    echo -e "${GREEN}✓${NC} Będzie używany SQLite w woluminie"
fi

echo ""

# Create volume
echo -e "${YELLOW}Tworzenie wolumenu dla danych...${NC}"
if flyctl volumes create saper_data --region fra --size 1 -a "$APP_NAME"; then
    echo -e "${GREEN}✓${NC} Wolumin utworzony"
else
    echo -e "${RED}❌ Nie udało się utworzyć wolumenu${NC}"
fi

echo ""

# Set secrets
echo "═══════════════════════════════════════"
echo "Ustawianie zmiennych środowiskowych"
echo "═══════════════════════════════════════"

# Generate SECRET_KEY
SECRET_KEY=$(openssl rand -hex 32)
echo -e "${YELLOW}Ustawianie SECRET_KEY...${NC}"
flyctl secrets set SECRET_KEY="$SECRET_KEY" -a "$APP_NAME"
echo -e "${GREEN}✓${NC} SECRET_KEY ustawiony"

echo ""
echo "Czy chcesz ustawić ANTHROPIC_API_KEY? (opcjonalne)"
read -p "[y/n]: " SET_API_KEY

if [[ "$SET_API_KEY" == "y" || "$SET_API_KEY" == "Y" ]]; then
    read -p "Podaj ANTHROPIC_API_KEY: " API_KEY
    if [ ! -z "$API_KEY" ]; then
        flyctl secrets set ANTHROPIC_API_KEY="$API_KEY" -a "$APP_NAME"
        echo -e "${GREEN}✓${NC} ANTHROPIC_API_KEY ustawiony"
    fi
fi

echo ""
echo "═══════════════════════════════════════"
echo "Czy chcesz teraz wdrożyć aplikację?"
echo "═══════════════════════════════════════"
read -p "[y/n]: " DEPLOY_NOW

if [[ "$DEPLOY_NOW" == "y" || "$DEPLOY_NOW" == "Y" ]]; then
    echo ""
    echo -e "${YELLOW}Wdrażanie aplikacji...${NC}"
    echo "To może potrwać kilka minut..."
    echo ""

    if flyctl deploy -a "$APP_NAME"; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║           🎉 SUKCES! 🎉                ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "Twoja aplikacja jest dostępna pod:"
        echo -e "${GREEN}https://${APP_NAME}.fly.dev${NC}"
        echo ""
        echo "Przydatne komendy:"
        echo "  flyctl status -a $APP_NAME      # Status aplikacji"
        echo "  flyctl logs -a $APP_NAME        # Logi"
        echo "  flyctl open -a $APP_NAME        # Otwórz w przeglądarce"
        echo ""
    else
        echo -e "${RED}❌ Deployment nie powiódł się${NC}"
        echo "Sprawdź logi: flyctl logs -a $APP_NAME"
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}✓${NC} Konfiguracja zakończona!"
    echo ""
    echo "Aby wdrożyć aplikację później, uruchom:"
    echo "  flyctl deploy -a $APP_NAME"
    echo ""
fi

# GitHub Actions setup
echo "═══════════════════════════════════════"
echo "🤖 Czy chcesz skonfigurować GitHub Actions?"
echo "   (Automatyczny deployment przy push'u)"
echo "═══════════════════════════════════════"
read -p "[y/n]: " SETUP_ACTIONS

if [[ "$SETUP_ACTIONS" == "y" || "$SETUP_ACTIONS" == "Y" ]]; then
    echo ""
    echo "1. Pobierz token API:"
    echo ""
    TOKEN=$(flyctl auth token)
    echo -e "${GREEN}Token API:${NC}"
    echo "$TOKEN"
    echo ""
    echo "2. Dodaj secret do GitHub:"
    echo "   - Idź do: Settings → Secrets and variables → Actions"
    echo "   - Kliknij: New repository secret"
    echo "   - Nazwa: FLY_API_TOKEN"
    echo "   - Wartość: [wklej token powyżej]"
    echo ""
    echo "3. Po dodaniu secret'a, push do main wykona automatyczny deployment!"
    echo ""
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Wszystko gotowe! 🚀${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
