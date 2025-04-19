#!/bin/bash

echo "Installing lftp..."
apt update && apt install -y lftp

echo "Deploying to $SFTP_HOST:$SFTP_PORT as $SFTP_USER..."

lftp -u "$SFTP_USER","$SFTP_PASSWORD" -p "$SFTP_PORT" sftp://"$SFTP_HOST" <<EOF
mirror -R ./ /home/$SFTP_USER/public_html/colorpicker
bye
EOF

echo "Deploy complete!"