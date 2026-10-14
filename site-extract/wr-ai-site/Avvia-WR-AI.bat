@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js non e installato. Installa Node.js 20 o successivo da https://nodejs.org/
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

if not exist "node_modules\express" (
  echo Installazione delle dipendenze...
  call npm install
  if errorlevel 1 (
    echo Installazione non riuscita. Controlla la connessione Internet e riprova.
    pause
    exit /b 1
  )
)

start "WR AI server" cmd /k "cd /d ""%~dp0"" && npm start"
echo Avvio del server WR AI...
timeout /t 3 /nobreak >nul
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
  start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else (
  start "" "http://localhost:3000"
)
echo Il sito si apre in Chrome, se installato, o nel browser predefinito.
echo Per spegnere il server, chiudi la finestra "WR AI server".
endlocal
