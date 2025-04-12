#!/bin/bash

# Set error handling
set -euo pipefail

# Set working directory to script location
cd "$(dirname "$0")"

# Container names/IDs
WEB_CONTAINER="whiffwonder-web-1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function for cleanup
cleanup() {
    rm -f ../.dockerignore
}

# Set trap for cleanup
trap cleanup EXIT

# Check if container exists
if ! docker ps -a -q -f name="$WEB_CONTAINER" > /dev/null 2>&1; then
    echo -e "${RED}Container $WEB_CONTAINER not found. Is Docker running?${NC}"
    exit 1
fi

# Create temporary .dockerignore
echo -e "${YELLOW}Creating temporary .dockerignore...${NC}"
cat > ../.dockerignore << EOL
node_modules/
data/redis-data/
.git/
.dockerignore
docker/
EOL

# Copy specific directories and files to container
echo -e "${YELLOW}Copying project files to container...${NC}"

# Array of directories and files to copy
items=(
    "public"
    "server"
    "config"
    "data"
    "js"
    "References"
    "package.json"
    "package-lock.json"
    "README.md"
    "documentație.md"
)

for item in "${items[@]}"; do
    if [ -e "../$item" ]; then
        echo -e "${YELLOW}Copying $item...${NC}"
        if ! docker cp "../$item" "$WEB_CONTAINER:/app/$item"; then
            echo -e "${RED}Error copying $item${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Warning: $item not found, skipping...${NC}"
    fi
done

echo -e "${GREEN}Successfully copied files to container${NC}"

# Install dependencies in container
echo -e "${YELLOW}Installing dependencies in container...${NC}"
if ! docker exec -it "$WEB_CONTAINER" npm install; then
    echo -e "${RED}Error installing dependencies${NC}"
    exit 1
fi

# Restart container
echo -e "${YELLOW}Restarting web container...${NC}"
if ! docker compose restart web; then
    echo -e "${RED}Error restarting container${NC}"
    exit 1
fi

echo -e "${GREEN}Container restarted successfully${NC}"

# Wait for container to initialize
echo -e "${YELLOW}Waiting for container to initialize...${NC}"
sleep 5

# Verify container is running and check health
if docker ps -q -f name="$WEB_CONTAINER" -f health=healthy > /dev/null 2>&1; then
    echo -e "${GREEN}Web container is running and healthy${NC}"
    echo -e "${YELLOW}Recent container logs:${NC}"
    docker logs --tail 10 "$WEB_CONTAINER"
else
    echo -e "${RED}Warning: Web container may not be running properly or is unhealthy${NC}"
    docker ps -a -f name="$WEB_CONTAINER" --format "{{.Status}}"
fi

echo -e "\n${GREEN}Operation completed!${NC}"
echo -e "${YELLOW}To view full container logs, run: docker logs $WEB_CONTAINER${NC}"
