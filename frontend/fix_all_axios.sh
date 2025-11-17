#!/bin/bash

echo "Fixing all axios calls..."

# Fix axios.get with backtick in wrong place
find src -name "*.jsx" -type f -exec sed -i 's|axios\.get`\${API_URL}\([^`]*\)`), {|axios.get(`${API_URL}\1`, {|g' {} \;

# Fix axios.post
find src -name "*.jsx" -type f -exec sed -i 's|axios\.post`\${API_URL}\([^`]*\)`), {|axios.post(`${API_URL}\1`, {|g' {} \;
find src -name "*.jsx" -type f -exec sed -i 's|axios\.post`\${API_URL}\([^`]*\)`,|axios.post(`${API_URL}\1`,|g' {} \;

# Fix axios.put
find src -name "*.jsx" -type f -exec sed -i 's|axios\.put`\${API_URL}\([^`]*\)`), {|axios.put(`${API_URL}\1`, {|g' {} \;

# Fix axios.delete
find src -name "*.jsx" -type f -exec sed -i 's|axios\.delete`\${API_URL}\([^`]*\)`), {|axios.delete(`${API_URL}\1`, {|g' {} \;

echo "Done!"
