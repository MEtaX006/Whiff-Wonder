@echo off
setlocal enabledelayedexpansion

:: Set working directory to script location
cd /d "%~dp0"

:: Container names/IDs
set WEB_CONTAINER=whiffwonder-web-1

:: Check if container exists and is running
docker ps -q -f name="%WEB_CONTAINER%" > nul 2>&1
if %errorlevel% neq 0 (
    echo Container %WEB_CONTAINER% not found or not running. Starting services...
    docker compose up -d
    timeout /t 10 /nobreak > nul
)

:: Create temporary .dockerignore
echo Creating temporary .dockerignore...
(
echo node_modules/
echo data/redis-data/
echo .git/
echo .dockerignore
echo docker/
) > ..\.dockerignore

:: Ensure container has necessary directories
echo Creating necessary directories in container...
docker exec %WEB_CONTAINER% mkdir -p /app/public /app/server /app/config /app/data /app/js /app/References

:: Copy specific directories and files to container
echo Copying project files to container...
for %%i in (
    public
    server
    config
    data
    js
    References
    package.json
    package-lock.json
    README.md
    "documentație.md"
) do (
    if exist "..\\%%i" (
        echo Copying %%i...
        docker cp "..\\%%i" "%WEB_CONTAINER%:/app/"
        if !errorlevel! neq 0 (
            echo Error copying %%i
            goto :error
        )
    ) else (
        echo Warning: %%i not found, skipping...
    )
)

echo Successfully copied files to container

:: Clean up
del ..\.dockerignore

:: Fix permissions in container
echo Fixing permissions in container...
docker exec %WEB_CONTAINER% chown -R appuser:appgroup /app

:: Install dependencies in container
echo Installing dependencies in container...
docker exec %WEB_CONTAINER% npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies
    goto :error
)

:: Restart container
echo Restarting web container...
docker compose restart web
if %errorlevel% neq 0 (
    echo Error restarting container
    goto :error
)

echo Container restarted successfully

:: Wait for container to initialize
echo Waiting for container to initialize...
timeout /t 5 /nobreak > nul

:: Verify container is running and check health
docker ps -q -f name="%WEB_CONTAINER%" -f health=healthy > nul 2>&1
if %errorlevel% equ 0 (
    echo Web container is running and healthy
    echo Recent container logs:
    docker logs --tail 10 "%WEB_CONTAINER%"
) else (
    echo Warning: Web container may not be running properly or is unhealthy
    docker ps -a -f name="%WEB_CONTAINER%" --format "{{.Status}}"
)

echo.
echo Operation completed!
echo To view full container logs, run: docker logs %WEB_CONTAINER%
goto :end

:error
del ..\.dockerignore 2>nul
echo Operation failed
exit /b 1

:end
exit /b 0
