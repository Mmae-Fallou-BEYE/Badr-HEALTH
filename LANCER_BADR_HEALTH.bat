@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 > nul
title Demarrer Badr Health
cd /d "%~dp0"

echo ============================================================
echo   BADR HEALTH
echo   Le site va s'ouvrir dans votre navigateur.
echo   Gardez cette fenetre ouverte pendant l'utilisation.
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe.
    echo Installez Node.js LTS depuis https://nodejs.org puis relancez ce fichier.
    pause
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] npm est introuvable. Reinstallez Node.js LTS.
    pause
    exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
    echo Installation initiale des dependances du site...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo [ERREUR] L'installation a echoue. Verifiez votre connexion Internet.
        pause
        exit /b 1
    )
)

set "OLLAMA_EXE="
for /f "delims=" %%I in ('where ollama.exe 2^>nul') do if not defined OLLAMA_EXE set "OLLAMA_EXE=%%I"
if not defined OLLAMA_EXE if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
if not defined OLLAMA_EXE if exist "C:\Program Files\Ollama\ollama.exe" set "OLLAMA_EXE=C:\Program Files\Ollama\ollama.exe"

if defined OLLAMA_EXE (
    set "UV_EXE="
    for /f "delims=" %%I in ('where uv.exe 2^>nul') do if not defined UV_EXE set "UV_EXE=%%I"
    if not defined UV_EXE if exist "%USERPROFILE%\.local\bin\uv.exe" set "UV_EXE=%USERPROFILE%\.local\bin\uv.exe"

    if not exist ".venv-biomistral\Scripts\python.exe" (
        if defined UV_EXE (
            echo Preparation de Python pour BioMistral...
            call "!UV_EXE!" venv --python 3.11 .venv-biomistral
        ) else (
            where py.exe >nul 2>nul
            if not errorlevel 1 (
                echo Preparation de Python pour BioMistral...
                py -3.11 -m venv .venv-biomistral
            ) else (
                where python.exe >nul 2>nul
                if not errorlevel 1 (
                    echo Preparation de Python pour BioMistral...
                    python -m venv .venv-biomistral
                )
            )
        )
    )

    if exist ".venv-biomistral\Scripts\python.exe" (
        ".venv-biomistral\Scripts\python.exe" -c "import ollama, pydantic" >nul 2>nul
        if errorlevel 1 (
            echo Installation des dependances BioMistral...
            if defined UV_EXE (
                call "!UV_EXE!" pip install --python ".venv-biomistral\Scripts\python.exe" -r requirements-biomistral.txt
            ) else (
                ".venv-biomistral\Scripts\python.exe" -m pip install -r requirements-biomistral.txt
            )
        )

        ".venv-biomistral\Scripts\python.exe" -c "import ollama, pydantic" >nul 2>nul
        if not errorlevel 1 (
            "!OLLAMA_EXE!" list >nul 2>nul
            if errorlevel 1 (
                echo Demarrage du serveur Ollama local...
                start "Ollama local" /min "!OLLAMA_EXE!" serve
                timeout /t 5 /nobreak >nul
            )

            "!OLLAMA_EXE!" list 2>nul | findstr /c:"m/biomistral" >nul
            if errorlevel 1 (
                echo [INFO] Modele BioMistral non installe. Le site et l'API demarrent, sans analyse IA.
                echo         Pour installer le modele d'environ 4,4 Go, voir README.md.
            ) else (
                echo Modele BioMistral trouve.
            )

            curl.exe -sS -o NUL http://127.0.0.1:8765/api/health >nul 2>nul
            if errorlevel 1 (
                echo Demarrage de l'API BioMistral locale...
                start "Badr Health - BioMistral" /min "%CD%\.venv-biomistral\Scripts\python.exe" -m biomistral.api
            ) else (
                echo API BioMistral deja active.
            )
        ) else (
            echo [AVERTISSEMENT] Dependances Python indisponibles : le site demarrera sans l'IA.
        )
    ) else (
        echo [AVERTISSEMENT] Python 3.11 ou uv est requis pour BioMistral.
        echo                 Le site demarrera sans l'IA.
    )
) else (
    echo [AVERTISSEMENT] Ollama n'a pas ete trouve. Le site demarrera sans l'IA.
)

curl.exe -sS -o NUL http://127.0.0.1:3000/ >nul 2>nul
if not errorlevel 1 (
    echo Le site fonctionne deja sur http://localhost:3000.
    echo Aucune seconde instance ne sera lancee.
    start "" "http://localhost:3000"
    exit /b 0
)

echo.
echo Ouverture du site sur http://localhost:3000
echo Pour arreter le site, appuyez sur Ctrl+C dans cette fenetre.
echo ============================================================
echo.
call npm.cmd run dev -- --host 127.0.0.1 --port 3000 --strictPort --open
if errorlevel 1 (
    echo.
    echo [ERREUR] Le site n'a pas pu demarrer.
    echo Si le port 3000 est deja utilise, fermez l'autre instance et reessayez.
    pause
)
