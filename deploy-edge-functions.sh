#!/bin/bash

# ============================================================================
# Script de déploiement des Edge Functions Supabase
# ============================================================================
# Usage: ./deploy-edge-functions.sh [project-id]
# Exemple: ./deploy-edge-functions.sh abcdefghijklmnop
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Déploiement Edge Functions Supabase${NC}"
echo ""

# ============================================================================
# 1. Vérifier que Supabase CLI est installé
# ============================================================================

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo "Installation : brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI installé${NC}"

# ============================================================================
# 2. Vérifier la connexion
# ============================================================================

echo ""
echo -e "${YELLOW}🔐 Vérification de l'authentification...${NC}"

if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vous devez vous connecter à Supabase${NC}"
    supabase login
fi

echo -e "${GREEN}✅ Authentifié${NC}"

# ============================================================================
# 3. Lier le projet (si pas déjà fait)
# ============================================================================

echo ""
echo -e "${YELLOW}🔗 Liaison au projet Supabase...${NC}"

# Vérifier si on a fourni un project ID en argument
if [ -n "$1" ]; then
    PROJECT_ID="$1"
    echo "Project ID fourni : $PROJECT_ID"
    
    # Lier le projet
    supabase link --project-ref "$PROJECT_ID" || {
        echo -e "${YELLOW}⚠️  Projet déjà lié ou erreur${NC}"
    }
else
    # Demander le project ID
    echo -e "${YELLOW}Entrez votre Supabase Project ID (Reference ID) :${NC}"
    echo "Trouvez-le dans : Supabase Dashboard > Project Settings > General"
    read -p "Project ID: " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Project ID requis${NC}"
        exit 1
    fi
    
    supabase link --project-ref "$PROJECT_ID"
fi

echo -e "${GREEN}✅ Projet lié${NC}"

# ============================================================================
# 4. Déployer l'Edge Function send-push
# ============================================================================

echo ""
echo -e "${YELLOW}📦 Déploiement de l'Edge Function send-push...${NC}"

supabase functions deploy send-push --no-verify-jwt || {
    echo -e "${RED}❌ Erreur lors du déploiement${NC}"
    exit 1
}

echo -e "${GREEN}✅ Edge Function déployée${NC}"

# ============================================================================
# 5. Afficher les informations
# ============================================================================

echo ""
echo -e "${GREEN}🎉 Déploiement réussi !${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes :${NC}"
echo ""
echo "1. Configurez les secrets dans le Dashboard Supabase :"
echo "   - SUPABASE_URL = https://$PROJECT_ID.supabase.co"
echo "   - SUPABASE_SERVICE_ROLE_KEY = [votre service_role key]"
echo ""
echo "2. URL de votre Edge Function :"
echo -e "   ${GREEN}https://$PROJECT_ID.supabase.co/functions/v1/send-push${NC}"
echo ""
echo "3. Testez votre fonction :"
echo "   curl -X POST 'https://$PROJECT_ID.supabase.co/functions/v1/send-push' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"tokens\":[\"ExponentPushToken[xxx]\"],\"title\":\"Test\",\"body\":\"Test\"}'"
echo ""
echo "4. Activez les triggers SQL :"
echo "   - Ouvrez le SQL Editor dans Supabase"
echo "   - Exécutez le fichier: database/ACTIVATE_NOTIFICATION_TRIGGERS.sql"
echo "   - N'oubliez pas de remplacer YOUR_PROJECT_ID par: $PROJECT_ID"
echo ""
echo -e "${YELLOW}📚 Documentation complète : EDGE_FUNCTION_DEPLOYMENT.md${NC}"
echo ""



