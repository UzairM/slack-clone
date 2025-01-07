#!/bin/bash

# Create directories
mkdir -p synapse/data
mkdir -p postgres/data

# Generate the configuration file
docker run -it --rm \
    -v "$(pwd)/synapse/data:/data" \
    -e SYNAPSE_SERVER_NAME=chatgenius.local \
    -e SYNAPSE_REPORT_STATS=no \
    matrixdotorg/synapse:latest generate

# Set correct permissions
chmod -R 777 synapse/data
chmod -R 777 postgres/data
