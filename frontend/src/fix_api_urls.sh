#!/bin/bash

# Fix single quotes to backticks for API_URL template literals
find src -name "*.jsx" -type f | while read file; do
  echo "Fixing $file..."
  # Replace '${API_URL} with `${API_URL}
  sed -i "s|'\${API_URL}|\`\${API_URL}|g" "$file"
  # Make sure closing quotes are also backticks
  sed -i "s|\${API_URL}/api/\([^']*\)'|\${API_URL}/api/\1\`|g" "$file"
done

echo "Done! Verifying changes..."
grep -r "'\${API_URL}" src --include="*.jsx" && echo "ERROR: Still found single quotes!" || echo "SUCCESS: All fixed!"
