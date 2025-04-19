
#!/bin/bash

# Configuration
echo "Starting deployment..."

# Check for required environment variables
if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_PASSWORD" ]; then
    echo "Error: Required environment variables are not set"
    echo "Please set SFTP_HOST, SFTP_USER, and SFTP_PASSWORD"
    exit 1
fi

# Create SFTP batch commands
echo "Creating SFTP commands..."
cat > sftp_batch << EOF
cd public_html/colorpicker
put index.html
put manifest.json
put sw.js
put -r css
put -r data
put -r icons
put -r js
put -r splash
quit
EOF

# Execute SFTP transfer
echo "Deploying files..."
sftp -b sftp_batch -P 21098 "$SFTP_USER@$SFTP_HOST"

# Cleanup
rm sftp_batch
echo "Deployment complete!"
