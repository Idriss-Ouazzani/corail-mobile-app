#!/usr/bin/env python3
"""Fix getUser export in supabaseApi.ts"""

import re

# Lire le fichier
with open('src/services/supabaseApi.ts', 'r') as f:
    content = f.read()

# Chercher et remplacer
pattern = r'(export const supabaseApi = \{\s+setUserId,\s+clearAuth,)'
replacement = r'\1\n  getUser,'

content_new = re.sub(pattern, replacement, content)

# Écrire le fichier
with open('src/services/supabaseApi.ts', 'w') as f:
    f.write(content_new)

print("✅ getUser ajouté à l'export supabaseApi")

