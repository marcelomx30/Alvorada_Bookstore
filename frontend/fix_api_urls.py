#!/usr/bin/env python3
import re
import os
from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Add import if not present
    if 'import { API_URL }' not in content:
        # Determine the correct relative path
        depth = str(filepath).count('/') - str(Path('src')).count('/')
        if depth == 2:  # src/pages/file.jsx
            import_path = '../config'
        elif depth == 3:  # src/pages/admin/file.jsx
            import_path = '../../config'
        elif depth == 2 and 'contexts' in str(filepath):  # src/contexts/file.jsx
            import_path = '../config'
        else:
            import_path = '../config'
        
        # Add import after the last import statement
        lines = content.split('\n')
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import_idx = i
        lines.insert(last_import_idx + 1, f"import {{ API_URL }} from '{import_path}'")
        content = '\n'.join(lines)
    
    # Replace all localhost:8080 with ${API_URL}
    # Handle different quote styles
    content = re.sub(r"'http://localhost:8080", r'`${API_URL}', content)
    content = re.sub(r'"http://localhost:8080', r'`${API_URL}', content)
    content = re.sub(r'`http://localhost:8080', r'`${API_URL}', content)
    
    # Fix any trailing quotes to backticks
    content = re.sub(r'\$\{API_URL\}/api/([^`\'"]*)\'', r'${API_URL}/api/\1`', content)
    content = re.sub(r'\$\{API_URL\}/api/([^`\'"]*)\"', r'${API_URL}/api/\1`', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

# Fix all relevant files
files_to_fix = [
    'src/contexts/AuthContext.jsx',
    'src/pages/BookCatalog.jsx',
    'src/pages/MyRentals.jsx',
    'src/pages/ForgotPassword.jsx',
    'src/pages/admin/ManageBooks.jsx',
    'src/pages/admin/ManageRentals.jsx',
    'src/pages/admin/ManageUsers.jsx',
]

for file in files_to_fix:
    if os.path.exists(file):
        fix_file(file)
    else:
        print(f"Not found: {file}")

print("\nDone! Now test with: npm run build")
