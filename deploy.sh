
#!/bin/bash

# Configuration
echo "Starting deployment..."

# Check for required environment variables
if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_PASSWORD" ]; then
    echo "Error: Required environment variables are not set"
    echo "Please set SFTP_HOST, SFTP_USER, and SFTP_PASSWORD"
    exit 1
fi

# Create a temporary directory for deployment
DEPLOY_DIR=$(mktemp -d)
echo "Created temporary directory: $DEPLOY_DIR"

# Copy all required files to temporary directory
cp -r css data icons js splash index.html manifest.json sw.js "$DEPLOY_DIR/"
echo "Files copied to temporary directory"

# Use scp to transfer files
sshpass -p "$SFTP_PASSWORD" scp -r -P 21098 -o StrictHostKeyChecking=no "$DEPLOY_DIR"/* "$SFTP_USER@$SFTP_HOST:public_html/colorpicker/"

# Cleanup
rm -rf "$DEPLOY_DIR"
echo "Deployment complete!"
