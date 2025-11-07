# 🚀 Fly.io Setup Guide - Saper QR

Kompletna instrukcja wdrożenia aplikacji Saper QR na platformie Fly.io.

## 📋 Wymagania wstępne

- Konto na [Fly.io](https://fly.io) (darmowy tier dostępny)
- Git zainstalowany lokalnie
- (Opcjonalnie) flyctl zainstalowane lokalnie dla ręcznego deploymentu

---

## 🎯 Wybierz metodę wdrożenia

### **Metoda 1: GitHub Actions (Zalecana) ✨**

Automatyczny deployment przy każdym push'u do głównej gałęzi.

### **Metoda 2: Lokalny deployment**

Ręczny deployment z lokalnej maszyny.

---

## 🤖 Metoda 1: GitHub Actions (Automatyczna)

### Krok 1: Zainstaluj flyctl lokalnie

**Linux/macOS:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Homebrew (macOS):**
```bash
brew install flyctl
```

### Krok 2: Zaloguj się do Fly.io

```bash
flyctl auth login
```

### Krok 3: Utwórz aplikację na Fly.io

```bash
# Wejdź do katalogu projektu
cd Saper-FLY2

# Utwórz nową aplikację (zmień nazwę na unikalną)
flyctl apps create saper-qr-app-2025

# LUB użyj interaktywnego kreatora
flyctl launch --no-deploy
```

**Ważne:** Zanotuj nazwę aplikacji! Będzie potrzebna w kolejnych krokach.

### Krok 4: Zaktualizuj fly.toml

Edytuj plik `fly.toml` i zmień nazwę aplikacji:

```toml
app = 'saper-qr-app-2025'  # Twoja unikalna nazwa
```

### Krok 5: Utwórz bazę danych PostgreSQL (Opcjonalnie)

Jeśli chcesz używać PostgreSQL zamiast SQLite:

```bash
# Utwórz bazę danych Postgres
flyctl postgres create --name saper-qr-db --region fra

# Podłącz do aplikacji
flyctl postgres attach saper-qr-db -a saper-qr-app-2025
```

**Dla SQLite:** Aplikacja automatycznie użyje SQLite w woluminie `/data` (już skonfigurowane).

### Krok 6: Utwórz wolumin dla danych

```bash
flyctl volumes create saper_data --region fra --size 1 -a saper-qr-app-2025
```

### Krok 7: Ustaw zmienne środowiskowe

```bash
# Wygeneruj i ustaw Flask secret key
flyctl secrets set SECRET_KEY="$(openssl rand -hex 32)" -a saper-qr-app-2025

# Jeśli używasz API Claude (opcjonalnie)
flyctl secrets set ANTHROPIC_API_KEY="sk-ant-your-key-here" -a saper-qr-app-2025
```

### Krok 8: Pobierz token API dla GitHub Actions

```bash
flyctl auth token
```

Skopiuj token z wyniku.

### Krok 9: Dodaj secret do GitHub

1. Idź do swojego repozytorium na GitHub
2. Przejdź do: **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **"New repository secret"**
4. Nazwa: `FLY_API_TOKEN`
5. Wartość: Wklej token z kroku 8
6. Kliknij **"Add secret"**

### Krok 10: Wykonaj pierwszy deployment

```bash
# Commituj zmiany
git add .
git commit -m "Configure Fly.io deployment"
git push origin main
```

GitHub Actions automatycznie wykryje push i wykona deployment! 🎉

### Krok 11: Monitoruj deployment

1. Idź do zakładki **Actions** w GitHub
2. Kliknij na najnowszy workflow run
3. Obserwuj logi deploymentu

---

## 🖥️ Metoda 2: Lokalny deployment (Ręczny)

### Krok 1-7: Wykonaj jak w Metodzie 1

Wykonaj kroki 1-7 z Metody 1 (instalacja, tworzenie app, bazy, woluminu, secrets).

### Krok 8: Deploy z lokalnej maszyny

```bash
# Wejdź do katalogu projektu
cd Saper-FLY2

# Wdróż aplikację
flyctl deploy -a saper-qr-app-2025
```

### Krok 9: Weryfikacja

```bash
# Sprawdź status
flyctl status -a saper-qr-app-2025

# Otwórz aplikację
flyctl open -a saper-qr-app-2025

# Zobacz logi
flyctl logs -a saper-qr-app-2025
```

---

## 🔍 Weryfikacja i troubleshooting

### Sprawdź czy aplikacja działa:

```bash
# Status aplikacji
flyctl status -a saper-qr-app-2025

# Logi na żywo
flyctl logs -a saper-qr-app-2025

# Otwórz w przeglądarce
flyctl open -a saper-qr-app-2025
```

### Problemy z bazą danych:

```bash
# Sprawdź połączenie z Postgres
flyctl postgres connect -a saper-qr-db

# Sprawdź zmienne środowiskowe
flyctl secrets list -a saper-qr-app-2025
```

### Problemy z woluminem:

```bash
# Lista woluminów
flyctl volumes list -a saper-qr-app-2025

# SSH do maszyny i sprawdź /data
flyctl ssh console -a saper-qr-app-2025
ls -la /data
```

### Restart aplikacji:

```bash
flyctl apps restart -a saper-qr-app-2025
```

---

## 📊 Przydatne komendy

```bash
# Skalowanie (więcej maszyn)
flyctl scale count 2 -a saper-qr-app-2025

# Skalowanie (więcej RAM)
flyctl scale memory 512 -a saper-qr-app-2025

# Informacje o aplikacji
flyctl info -a saper-qr-app-2025

# Certyfikaty SSL
flyctl certs list -a saper-qr-app-2025

# Monitoring
flyctl dashboard -a saper-qr-app-2025
```

---

## 🎉 Gotowe!

Twoja aplikacja powinna być dostępna pod adresem:
```
https://saper-qr-app-2025.fly.dev
```

### Co dalej?

1. ✅ Przetestuj wszystkie funkcje aplikacji
2. ✅ Skonfiguruj custom domain (opcjonalnie)
3. ✅ Włącz automatyczne backupy bazy danych
4. ✅ Monitoruj użycie zasobów w dashboardzie Fly.io

---

## 📝 Notatki

### Struktura aplikacji:
- **Baza danych:** SQLite w woluminie `/data/db.sqlite3`
- **Uploady:** Persystentne w woluminie `/data`
- **Port wewnętrzny:** 8080
- **Region:** Frankfurt (fra)

### Limity darmowego tier:
- 3 maszyny shared-cpu-1x
- 256MB RAM per VM
- 3GB persystent storage
- 160GB transfer miesięcznie

### Bezpieczeństwo:
- ✅ HTTPS wymuszony
- ✅ Auto-start/stop maszyn (oszczędność)
- ✅ Secrets zarządzane bezpiecznie
- ✅ PostgreSQL z automatycznymi backupami (jeśli używasz)

---

## 🆘 Pomoc

- [Dokumentacja Fly.io](https://fly.io/docs/)
- [Community Forum](https://community.fly.io/)
- [Status Page](https://status.fly.io/)

---

*Ostatnia aktualizacja: 2025-11-07*
