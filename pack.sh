#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./pack.sh <version>"
    echo "Example: ./pack.sh 1.0.0"
    exit 1
fi

VERSION=$1
if [[ ! $VERSION == v* ]]; then
    VERSION="v$VERSION"
fi

FOLDER_NAME="google-sheets-hyperlink-converter-$VERSION"
ZIP_NAME="$FOLDER_NAME.zip"

# Remove existing zip and folder if exists
[ -f "$ZIP_NAME" ] && rm "$ZIP_NAME"
[ -d "$FOLDER_NAME" ] && rm -rf "$FOLDER_NAME"

# Create temp folder and copy files
mkdir "$FOLDER_NAME"
cp manifest.json background.js content.js i18n.js icon48.png icon128.png "$FOLDER_NAME/"

# Create zip file
zip -r "$ZIP_NAME" "$FOLDER_NAME"

# Clean up temp folder
rm -rf "$FOLDER_NAME"

echo "Created $ZIP_NAME successfully!" 