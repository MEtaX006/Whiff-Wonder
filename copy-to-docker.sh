#!/bin/bash

# Get the container name/ID
CONTAINER="whiffwonder-web-1"

# List of files to copy
FILES=(
    "styles.css"
    "server.js"
    "auth-check.js"
    "translations.js"
    "language-toggle.js"
    "items.json"
    "items-loader.js"
    "login.html"
    "register.html"
    "profile.html"
    "landing.html"
    "contact.html"
    "collection.html"
    "about.html"
)

# Loop through each file and copy it to the container
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Copying $file to container..."
        docker cp "./$file" "$CONTAINER:/app"
    else
        echo "Warning: $file not found"
    fi
done

echo "All files copied successfully!"
