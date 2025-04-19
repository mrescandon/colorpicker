
#!/bin/bash

# Display deployment start message
echo "Starting deployment process..."

# Check if required environment variables are set
if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_PORT" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_PASSWORD" ]; then
    echo "Error: Missing required environment variables"
    echo "Please ensure SFTP_HOST, SFTP_PORT, SFTP_USER, and SFTP_PASSWORD are set"
    exit 1
fi

# Create a temporary SFTP batch file
echo "Creating SFTP commands..."
cat > sftp_commands.txt << EOF
cd public_html/colorpicker
put -r *
EOF

# Execute SFTP transfer
echo "Deploying to $SFTP_HOST:$SFTP_PORT as $SFTP_USER..."
sshpass -p "$SFTP_PASSWORD" sftp -P "$SFTP_PORT" -o StrictHostKeyChecking=no -b sftp_commands.txt "$SFTP_USER@$SFTP_HOST"

# Clean up
rm sftp_commands.txt

echo "Deployment complete!"
