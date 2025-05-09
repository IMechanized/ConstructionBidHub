#!/bin/bash
# Script to fix import statements for Vercel deployment
# This script adds explicit .ts extensions to all imports of local files

# Make the script executable
chmod +x fix-vercel-imports.sh

# Define directories to search in
DIRECTORIES=("api" "server" "shared")

# Loop through each directory
for DIR in "${DIRECTORIES[@]}"; do
  echo "Processing $DIR directory..."
  
  # Find all TypeScript files in the directory
  FILES=$(find "$DIR" -name "*.ts")
  
  for FILE in $FILES; do
    echo "  Checking file: $FILE"
    
    # Look for imports without extensions
    # This pattern matches import statements with '../server/' or './module' type patterns
    # but without a file extension
    IMPORTS=$(grep -E "import .* from ['\"](\./|\.\./)[^'\"]+['\"];" "$FILE" | grep -v "\.ts['\"];" || true)
    
    if [ -n "$IMPORTS" ]; then
      echo "    Found imports to fix in $FILE"
      
      # Create a backup
      cp "$FILE" "${FILE}.bak"
      
      # Replace import statements to add .ts extension
      # This is a simplistic approach - for complex cases you might need to adjust
      sed -i 's/from \(["'"'"']\)\(\.\/\|\.\.\/*\)\([^"'"'"']*\)\(["'"'"']\)/from \1\2\3.ts\4/g' "$FILE"
      
      echo "    Fixed imports in $FILE"
    fi
  done
done

echo "Import fixing completed. Check files manually to ensure correctness."