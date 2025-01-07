# Create directories
New-Item -ItemType Directory -Force -Path synapse/data
New-Item -ItemType Directory -Force -Path postgres/data

# Generate the configuration file
docker run -it --rm `
    -v "${PWD}/synapse/data:/data" `
    -e SYNAPSE_SERVER_NAME=chatgenius.local `
    -e SYNAPSE_REPORT_STATS=no `
    matrixdotorg/synapse:latest generate
