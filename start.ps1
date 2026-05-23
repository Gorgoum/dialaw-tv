# Dialaw TV - Script de demarrage
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   DIALAW TV - Systeme de Gestion Comptable    " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verifier que node est installe
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Node.js n'est pas installe ou introuvable dans le PATH." -ForegroundColor Red
    pause; exit 1
}

# Verifier que npm est installe
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] npm n'est pas installe ou introuvable dans le PATH." -ForegroundColor Red
    pause; exit 1
}

# Tuer les processus qui occupent les ports si necessaire
function Kill-Port($port) {
    $pid = (netstat -ano | Select-String ":$port " | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
    if ($pid -and $pid -match '^\d+$') {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "  Port $port libere (PID $pid)" -ForegroundColor Yellow
    }
}

Write-Host "[1/2] Demarrage du backend (port 5050)..." -ForegroundColor Green
Kill-Port 5050
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k title Backend Dialaw TV && cd /d `"$backend`" && node server.js" `
    -WindowStyle Normal

Start-Sleep -Seconds 3

# Verifier que le backend repond
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5050/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  Backend OK - http://localhost:5050" -ForegroundColor Green
} catch {
    Write-Host "  [AVERTISSEMENT] Backend pas encore pret, continuons..." -ForegroundColor Yellow
}

Write-Host "[2/2] Demarrage du frontend (port 3000)..." -ForegroundColor Green
Kill-Port 3000
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k title Frontend Dialaw TV && cd /d `"$frontend`" && npm start" `
    -WindowStyle Normal

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Services en cours de demarrage..." -ForegroundColor White
Write-Host ""
Write-Host "  Backend  : http://localhost:5050" -ForegroundColor White
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Comptes par defaut :" -ForegroundColor Gray
Write-Host "    Admin      : admin@dialawtv.sn / admin2024" -ForegroundColor Gray
Write-Host "    Comptable  : comptable@dialawtv.sn / comptable2024" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Le navigateur s'ouvrira automatiquement dans quelques secondes." -ForegroundColor Green
Write-Host "Appuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
