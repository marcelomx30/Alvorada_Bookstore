#!/bin/bash

echo "Updating API URLs in frontend files..."

# Function to add import and replace URLs
update_file() {
    local file=$1
    local import_path=$2
    
    if [ ! -f "$file" ]; then
        echo "Warning: $file not found, skipping..."
        return
    fi
    
    echo "Processing $file..."
    
    # Check if import already exists
    if ! grep -q "import { API_URL }" "$file"; then
        # Add import at the top (after existing imports)
        sed -i "1i import { API_URL } from '$import_path'" "$file"
    fi
    
    # Replace all localhost:8080 occurrences
    sed -i "s|'http://localhost:8080'|\`\${API_URL}\`|g" "$file"
    sed -i 's|"http://localhost:8080"|`${API_URL}`|g' "$file"
    sed -i 's|`http://localhost:8080`|`${API_URL}`|g' "$file"
    sed -i 's|http://localhost:8080/|\${API_URL}/|g' "$file"
}

# Update files with correct import paths
update_file "src/contexts/AuthContext.jsx" "../config"
update_file "src/pages/admin/ManageBooks.jsx" "../../config"
update_file "src/pages/admin/ManageRentals.jsx" "../../config"
update_file "src/pages/admin/ManageUsers.jsx" "../../config"
update_file "src/pages/BookCatalog.jsx" "../config"
update_file "src/pages/ForgotPassword.jsx" "../config"
update_file "src/pages/MyRentals.jsx" "../config"

echo ""
echo "✓ Update complete!"
echo ""
echo "Files updated:"
echo "  - src/contexts/AuthContext.jsx"
echo "  - src/pages/admin/ManageBooks.jsx"
echo "  - src/pages/admin/ManageRentals.jsx"
echo "  - src/pages/admin/ManageUsers.jsx"
echo "  - src/pages/BookCatalog.jsx"
echo "  - src/pages/ForgotPassword.jsx"
echo "  - src/pages/MyRentals.jsx"
echo ""
echo "Verifying changes..."
echo ""

# Verify no localhost:8080 remains
remaining=$(grep -r "localhost:8080" src --include="*.jsx" | wc -l)
if [ $remaining -eq 0 ]; then
    echo "✓ All localhost:8080 references have been replaced!"
else
    echo "⚠ Warning: Found $remaining remaining localhost:8080 references"
    grep -r "localhost:8080" src --include="*.jsx"
fi

