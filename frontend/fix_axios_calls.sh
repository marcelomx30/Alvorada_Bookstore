#!/bin/bash

echo "Fixing axios calls..."

# Fix axios.get calls
find src -name "*.jsx" -type f -exec sed -i 's|axios\.get`\${API_URL}|axios.get(`${API_URL}|g' {} \;

# Fix axios.post calls
find src -name "*.jsx" -type f -exec sed -i 's|axios\.post`\${API_URL}|axios.post(`${API_URL}|g' {} \;

# Fix axios.put calls
find src -name "*.jsx" -type f -exec sed -i 's|axios\.put`\${API_URL}|axios.put(`${API_URL}|g' {} \;

# Fix axios.delete calls
find src -name "*.jsx" -type f -exec sed -i 's|axios\.delete`\${API_URL}|axios.delete(`${API_URL}|g' {} \;

# Now fix the closing - find lines with API_URL and add closing paren before comma
find src -name "*.jsx" -type f -exec sed -i 's|\${API_URL}/api/\([^`]*\)`,|\${API_URL}/api/\1\`),|g' {} \;

echo "Done! Checking results..."
grep "axios.get\`" src -r --include="*.jsx" && echo "ERROR: Found incorrect syntax" || echo "✓ axios.get fixed"
grep "axios.post\`" src -r --include="*.jsx" && echo "ERROR: Found incorrect syntax" || echo "✓ axios.post fixed"

