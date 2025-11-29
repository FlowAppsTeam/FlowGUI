#!/bin/bash

echo "Building Linux AppImage..."

# Build the Docker image
docker build -t flowgui-linux-builder -f Dockerfile.linux .

# Create a container and copy the built files
docker create --name flowgui-builder flowgui-linux-builder
docker cp flowgui-builder:/app/dist-electron ./
docker rm flowgui-builder

echo "Linux build complete! Check the dist-electron folder for the AppImage."
