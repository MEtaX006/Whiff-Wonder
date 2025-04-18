@echo off
setlocal EnableDelayedExpansion

:: Container name/ID
set "container=whiff-wonder-web-1"

:: Check if container exists
docker ps -q -f name=%container% > nul 2>&1
if errorlevel 1 (
    echo [91mError: Container '%container%' not found[0m
    exit /b 1
)

:: List of files to copy
set "files=styles.css server.js auth-check.js translations.js language-toggle.js items.json items-loader.js login.html register.html profile.html landing.html contact.html collection.html about.html product-details.html package.json"

:: Copy main files
for %%f in (%files%) do (
    if exist "%%f" (
        echo [93mCopying %%f to container...[0m
        docker cp ".\%%f" "%container%:/app"
        if errorlevel 0 (
            echo [92mSuccessfully copied %%f[0m
        ) else (
            echo [91mError copying %%f[0m
        )
    ) else (
        echo [93mWarning: %%f not found[0m
    )
)

:: Create References directory in container
echo [93mCreating References directory in container...[0m
docker exec %container% mkdir -p /app/References

:: Copy Reference files
if exist "References" (
    echo [93mCopying References directory contents...[0m
    for %%f in (References\*.jpg References\*.png) do (
        echo [93mCopying %%f to container...[0m
        docker cp ".\%%f" "%container%:/app/%%f"
        if errorlevel 0 (
            echo [92mSuccessfully copied %%f[0m
        ) else (
            echo [91mError copying %%f[0m
        )
    )
) else (
    echo [91mWarning: References directory not found[0m
)

echo.
echo [92mAll files processed![0m
pause
