#!/bin/bash
# Script to fix import statements for Vercel deployment
# This script REMOVES .ts extensions from all imports to make them compatible with production

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
    
    # Look for imports WITH .ts extensions
    # This pattern matches import statements with '../server/file.ts' or './module.ts' type patterns
    IMPORTS=$(grep -E "import .* from ['\"](\./|\.\./)[^'\"]+\.ts['\"];" "$FILE" || true)
    
    if [ -n "$IMPORTS" ]; then
      echo "    Found imports to fix in $FILE"
      
      # Create a backup
      cp "$FILE" "${FILE}.bak"
      
      # Replace import statements to REMOVE .ts extension
      # This is a simplistic approach - for complex cases you might need to adjust
      sed -i 's/from \(["'"'"']\)\(\.\/\|\.\.\/*\)\([^"'"'"']*\)\.ts\(["'"'"']\)/from \1\2\3\4/g' "$FILE"
      
      echo "    Fixed imports in $FILE"
    fi
  done
done

echo "Import fixing completed. Check files manually to ensure correctness."
echo "IMPORTANT: Vercel deployments require imports WITHOUT file extensions:"
echo "  CORRECT: import { something } from '../path/to/file';"
echo "  WRONG:   import { something } from '../path/to/file.ts';"
echo "Make sure all imports follow this pattern before deploying to Vercel."